'use client';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  Tooltip, 
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { useState } from 'react';
// Remove the Tabs import and use a custom approach
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Colors for the pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

interface ChartData {
  salesData: { month: string; totalSales: number }[];
  categoryData?: { category: string; sales: number }[];
  topProducts?: { 
    id: string; 
    name: string; 
    quantity: number; 
    revenue: number;
    isWeightBased?: boolean;
    weightSold?: number;
    weightUnit?: string | null;
  }[];
}

const Charts = ({
  data,
}: {
  data: ChartData;
}) => {
  const [activeTab, setActiveTab] = useState("monthly");

  // Custom tooltip for the bar chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border p-2 rounded-md shadow-sm">
          <p className="font-medium">{label}</p>
          <p className="text-sm">{`Sales: ${formatCurrency(payload[0].value)}`}</p>
        </div>
      );
    }
    return null;
  };

  // Format the category data for better display
  const formatCategoryData = () => {
    if (!data.categoryData) return [];
    
    // Calculate the total sum of all category sales
    const categorySalesTotal = data.categoryData.reduce((sum, category) => sum + category.sales, 0);
    
    // Add percentage value and formatted currency
    return data.categoryData.map(item => ({
      ...item,
      formattedSales: formatCurrency(item.sales),
      percentage: ((item.sales / categorySalesTotal) * 100)
    }));
  };

  // Custom tooltip for the pie chart
  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border p-2 rounded-md shadow-sm">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-sm">{`Sales: ${payload[0].payload.formattedSales}`}</p>
          <p className="text-sm">{`${payload[0].payload.percentage.toFixed(1)}% of total`}</p>
        </div>
      );
    }
    return null;
  };

  // Simple custom tab component
  const TabNavigation = () => (
    <div className="flex space-x-2 mb-4">
      <button
        onClick={() => setActiveTab("monthly")}
        className={`px-4 py-2 rounded-md text-sm font-medium ${
          activeTab === "monthly" 
            ? "bg-primary text-primary-foreground" 
            : "bg-muted text-muted-foreground hover:bg-gray-200"
        }`}
      >
        Monthly Sales
      </button>
      
      {data.categoryData && data.categoryData.length > 0 && (
        <button
          onClick={() => setActiveTab("category")}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            activeTab === "category" 
              ? "bg-primary text-primary-foreground" 
              : "bg-muted text-muted-foreground hover:bg-gray-200"
          }`}
        >
          Sales by Category
        </button>
      )}
      
      {data.topProducts && data.topProducts.length > 0 && (
        <button
          onClick={() => setActiveTab("products")}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            activeTab === "products" 
              ? "bg-primary text-primary-foreground" 
              : "bg-muted text-muted-foreground hover:bg-gray-200"
          }`}
        >
          Top Products
        </button>
      )}
    </div>
  );

  return (
    <div>
      <TabNavigation />
      
      {activeTab === "monthly" && (
        <div className="h-[350px]">
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart data={data.salesData}>
              <XAxis
                dataKey='month'
                stroke='#888888'
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke='#888888'
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `Bs. ${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey='totalSales'
                fill='currentColor'
                radius={[4, 4, 0, 0]}
                className='fill-primary'
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      
      {activeTab === "category" && data.categoryData && data.categoryData.length > 0 && (
        <div className="h-[350px]">
          <ResponsiveContainer width='100%' height='100%'>
            <PieChart>
              <Pie
                data={formatCategoryData()}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={120}
                fill="#8884d8"
                dataKey="sales"
                nameKey="category"
                label={({ category, payload }) => 
                  `${category}: ${payload.percentage.toFixed(0)}%`
                }
              >
                {data.categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
      
      {activeTab === "products" && data.topProducts && data.topProducts.length > 0 && (
        <div className="h-[350px]">
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart 
              data={data.topProducts}
              layout="vertical"
              margin={{ left: 100 }} // Add margin for product names
            >
              <XAxis
                type="number"
                stroke='#888888'
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `Bs. ${value}`}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke='#888888'
                fontSize={12}
                tickLine={false}
                axisLine={false}
                width={100}
              />
              <Tooltip 
                formatter={(value: any) => [formatCurrency(value), 'Revenue']}
                labelFormatter={(name) => `Product: ${name}`}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const product = data.topProducts?.find(p => p.name === label);
                    return (
                      <div className="p-2 bg-white border rounded-md shadow-md">
                        <p className="font-semibold">{label}</p>
                        <p>Revenue: {formatCurrency(payload[0].value as number)}</p>
                        {product && (
                          <p>
                            {product.isWeightBased && product.weightSold 
                              ? `Sold: ${product.weightSold} ${product.weightUnit || 'kg'} (by weight)`
                              : `Sold: ${product.quantity} units`}
                          </p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="revenue" 
                fill='currentColor' 
                className='fill-primary' 
                radius={[0, 4, 4, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default Charts; 