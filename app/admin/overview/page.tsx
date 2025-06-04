import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getOrderSummary } from '@/lib/actions/order.actions';
import { formatCurrency, formatDateTime, formatNumber } from '@/lib/utils';
import { BadgeDollarSign, Barcode, CreditCard, Package, ShoppingBag, Users, Clock, CheckCircle } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';
import Charts from '@/app/admin/overview/charts';
import { requireAdmin } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sales Analytics | Admin Dashboard',
};

interface OrderSummary {
  totalOrders: number;
  totalSales: number;
  pendingOrders: number;
  deliveredOrders: number;
  salesData: { month: string; totalSales: number }[];
  categoryData: { category: string; sales: number }[];
  topProducts: { 
    id: string; 
    name: string; 
    quantity: number; 
    revenue: number;
    isWeightBased?: boolean;
    weightSold?: number;
    weightUnit?: string | null;
  }[];
  latestOrders: {
    id: string;
    createdAt: Date;
    user: { name: string } | null;
    totalPrice: number;
  }[];
  userCount: number;
  productCount: number;
}

export default async function AdminOverviewPage() {
  try {
    await requireAdmin();
    
    let rawSummary;
    try {
      rawSummary = await getOrderSummary();
    } catch (summaryError) {
      console.error('Error fetching order summary:', summaryError);
      throw new Error(
        summaryError instanceof Error 
          ? summaryError.message 
          : 'Failed to fetch order summary data'
      );
    }
    
    if (!rawSummary) {
      throw new Error('Order summary data is undefined');
    }
    
    // Ensure all properties exist with defaults to prevent crashes
    const summary: OrderSummary = {
      totalOrders: rawSummary?.totalOrders || 0,
      totalSales: rawSummary?.totalSales || 0,
      pendingOrders: rawSummary?.pendingOrders || 0,
      deliveredOrders: rawSummary?.deliveredOrders || 0,
      salesData: rawSummary?.salesData || [],
      categoryData: rawSummary?.categoryData || [],
      topProducts: rawSummary?.topProducts || [],
      latestOrders: (rawSummary?.latestOrders || []).map(order => ({
        id: String(order.id || ''),
        createdAt: new Date(order.created_at || new Date()),
        user: order.user?.[0] 
          ? { name: order.user[0].name || 'Unknown' } 
          : (order.shipping_address?.fullName 
              ? { name: order.shipping_address.fullName } 
              : null),
        totalPrice: Number(order.total_price || 0)
      })),
      userCount: rawSummary?.userCount || 0,
      productCount: rawSummary?.productCount || 0
    };

    // Ensure Charts component has valid data to prevent rendering issues
    const chartsData = {
      salesData: summary.salesData?.length ? summary.salesData : [{ month: 'No Data', totalSales: 0 }],
      categoryData: summary.categoryData?.length ? summary.categoryData : [{ category: 'No Data', sales: 0 }],
      topProducts: summary.topProducts?.length ? summary.topProducts : [{ id: '0', name: 'No Data', quantity: 0, revenue: 0 }],
    };

    return (
      <div className='space-y-6'>
        <div className="flex justify-between items-center">
          <h1 className='h2-bold'>Sales Analytics</h1>
          <div className="text-muted-foreground text-sm">
            Data updated as of {new Date().toLocaleDateString()}
          </div>
        </div>
        
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Total Revenue</CardTitle>
              <BadgeDollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {formatCurrency(summary.totalSales)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Lifetime sales revenue
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Total Orders</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {formatNumber(summary.totalOrders)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                All time order count
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Pending Orders</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {formatNumber(summary.pendingOrders)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting processing
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Completed Orders</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {formatNumber(summary.deliveredOrders)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Delivered to customers
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
          <div className="flex items-center">
            <Package className="h-5 w-5 mr-2 text-muted-foreground" />
            <span className="font-medium">Active Products:</span>
          </div>
          <div className="text-lg font-bold">{formatNumber(summary.productCount)}</div>
        </div>
        
        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-7'>
          <Card className='col-span-4'>
            <CardHeader>
              <CardTitle>Sales Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <Charts data={chartsData} />
            </CardContent>
          </Card>
          
          <Card className='col-span-3'>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>BUYER</TableHead>
                    <TableHead>DATE</TableHead>
                    <TableHead>TOTAL</TableHead>
                    <TableHead className="text-right">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.latestOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        {order?.user?.name ? order.user.name : 'Guest Order'}
                      </TableCell>
                      <TableCell>
                        {formatDateTime(order.createdAt).dateOnly}
                      </TableCell>
                      <TableCell>{formatCurrency(order.totalPrice)}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/pedidos/edit/${order.id}`}>
                          <span className='text-sm text-primary hover:underline'>Details</span>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 text-center">
                <Link href="/admin/pedidos" className="text-sm text-primary hover:underline">
                  View All Orders
                </Link>
              </div>
            </CardContent>
          </Card>
          
          <Card className='col-span-7'>
            <CardHeader>
              <CardTitle>Top Products by Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PRODUCT</TableHead>
                    <TableHead>QUANTITY/WEIGHT</TableHead>
                    <TableHead>REVENUE</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.topProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>
                        {product.isWeightBased && product.weightSold
                          ? `${formatNumber(product.weightSold)} ${product.weightUnit || 'kg'} (by weight)`
                          : `${formatNumber(product.quantity)} units`}
                      </TableCell>
                      <TableCell>{formatCurrency(product.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 text-center">
                <Link href="/admin/products" className="text-sm text-primary hover:underline">
                  Manage Products
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card className='col-span-7'>
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CATEGORY</TableHead>
                  <TableHead>SALES AMOUNT</TableHead>
                  <TableHead>% OF TOTAL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  // Calculate the total of all category sales for accurate percentages
                  const categorySalesTotal = summary.categoryData.reduce((sum, category) => sum + category.sales, 0);
                  
                  return summary.categoryData.map((category) => (
                    <TableRow key={category.category}>
                      <TableCell className="font-medium">{category.category}</TableCell>
                      <TableCell>{formatCurrency(category.sales)}</TableCell>
                      <TableCell>
                        {((category.sales / categorySalesTotal) * 100).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ));
                })()}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    // Proper error handling with detailed logging
    console.error('Error in AdminOverviewPage:', error instanceof Error ? error.message : 'Unknown error', 
      error instanceof Error ? error.stack : '');
    
    // Create a more specific error message for display
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unexpected error occurred while loading the dashboard';
    
    return (
      <div className='space-y-6'>
        <div className="flex justify-between items-center">
          <h1 className='h2-bold'>Sales Analytics</h1>
          <div className="text-muted-foreground text-sm">
            Error loading dashboard data
          </div>
        </div>
        
        <Card className='col-span-7'>
          <CardHeader>
            <CardTitle>Error Loading Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive mb-2">
              {errorMessage}
            </p>
            <p className="text-sm text-muted-foreground">
              Please try refreshing the page or contact support if the issue persists.
            </p>
            <div className="mt-4">
              <Link href="/admin" className="text-sm text-primary hover:underline">
                Return to Admin Home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
}
