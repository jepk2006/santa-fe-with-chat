import ProductCard from '@/components/shared/product/product-card';
import { Button } from '@/components/ui/button';
import {
  getAllProducts,
  getAllCategories,
} from '@/lib/actions/product.actions';
import Link from 'next/link';
import { Metadata } from 'next';
import { Sliders, ChevronDown, ChevronUp, Check, X, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Product } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';

/* ---------- helpers ---------- */
const prices = [
  { name: 'Bs. 1 to Bs. 50', value: '1-50' },
  { name: 'Bs. 51 to Bs. 100', value: '51-100' },
  { name: 'Bs. 101 to Bs. 200', value: '101-200' },
  { name: 'Bs. 201 to Bs. 500', value: '201-500' },
  { name: 'Bs. 501 to Bs. 1000', value: '501-1000' },
];
const ratings = [4, 3, 2, 1];

/* ---------- Next-js route settings ---------- */
export const dynamic = 'force-dynamic';

/* ---------- shared prop type ---------- */
type SearchParams = {
  q?: string;
  category?: string;
  price?: string;
  rating?: string;
  page?: string;
};

/* ---------- metadata ---------- */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const {
    q = 'all',
    category = 'all',
    price = 'all',
    rating = 'all',
  } = await searchParams;

  const isQuerySet = q && q !== 'all' && q.trim() !== '';
  const isCategorySet = category && category !== 'all' && category.trim() !== '';
  const isPriceSet = price && price !== 'all' && price.trim() !== '';
  const isRatingSet = rating && rating !== 'all' && rating.trim() !== '';

  return {
    title:
      isQuerySet || isCategorySet || isPriceSet || isRatingSet
        ? `Products ${isQuerySet ? q : ''} \
${isCategorySet ? `: Category ${category}` : ''}\
${isPriceSet ? `: Price ${price}` : ''}\
${isRatingSet ? `: Rating ${rating}` : ''}`
        : 'All Products',
  };
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const searchParamsObj = await searchParams;
  const {
    q = 'all',
    category = 'all',
    price = 'all',
    rating = 'all',
    page = '1',
  } = searchParamsObj;

  /* ----- helper for link building ----- */
  const getFilterUrl = ({
    c,
    p,
    r,
    pg,
  }: {
    c?: string;
    p?: string;
    r?: string;
    pg?: string;
  }) => {
    const params: SearchParams = { q, category, price, rating, page };
    if (c) params.category = c;
    if (p) params.price = p;
    if (r) params.rating = r;
    if (pg) params.page = pg;
    return `/products?${new URLSearchParams(params as Record<string, string>).toString()}`;
  };

  /* ----- data fetches ----- */
  const products = await getAllProducts({
    query: q,
    category,
    price,
    rating,
    page: Number(page),
  });
  const categories = await getAllCategories();

  /* ----- Calculate active filters ----- */
  interface FilterItem {
    type: string;
    value: string;
    label: string;
    clearUrl: string;
  }
  
  const activeFilters: FilterItem[] = [];
  if (category !== 'all' && category !== '') {
    activeFilters.push({ 
      type: 'category', 
      value: category, 
      label: `Category: ${category}`, 
      clearUrl: getFilterUrl({ c: 'all' }) 
    });
  }
  if (price !== 'all') {
    const priceLabel = prices.find(p => p.value === price)?.name || price;
    activeFilters.push({ 
      type: 'price', 
      value: price, 
      label: `Price: ${priceLabel}`, 
      clearUrl: getFilterUrl({ p: 'all' }) 
    });
  }
  if (rating !== 'all') {
    activeFilters.push({ 
      type: 'rating', 
      value: rating, 
      label: `Rating: ${rating} stars & up`, 
      clearUrl: getFilterUrl({ r: 'all' }) 
    });
  }
  
  /* ----- Filter UI Components ----- */
  const FilterAccordion = ({ className = '' }: { className?: string }) => {
    return (
      <Accordion type="multiple" defaultValue={[]} className={`space-y-2 ${className}`}>
        {/* Categories Accordion */}
        <AccordionItem value="categories" className="border-b">
          <AccordionTrigger className="py-3 w-full flex justify-between items-center text-base font-semibold hover:text-black">
            <div className="flex justify-between items-center w-full pr-2">
              <span className="font-medium">Categories</span>
              {category !== 'all' && category !== '' && (
                <span className="text-xs text-muted-foreground flex-shrink-0 group-data-[state=open]:hidden">
                  {category}
                </span>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-0 pb-3">
            <div className="px-2 py-1 space-y-1 max-h-60 overflow-y-auto scrollbar-thin">
              <Link
                href={getFilterUrl({ c: 'all' })}
                className={`block px-3 py-1.5 rounded-md hover:bg-blue-100 text-base ${(category === 'all' || category === '') ? 'bg-accent font-bold text-accent-foreground' : 'font-medium'}`}
              >
                All Categories
              </Link>
              
              {categories.map((x) => (
                <Link
                  key={x.category}
                  href={getFilterUrl({ c: x.category })}
                  className={`block px-3 py-1.5 rounded-md hover:bg-blue-100 text-base ${category === x.category ? 'bg-accent font-bold text-accent-foreground' : 'font-medium'}`}>
                  {x.category}
                </Link>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
        
        {/* Price Accordion */}
        <AccordionItem value="price" className="border-b first:border-t">
          <AccordionTrigger className="py-3 w-full flex justify-between items-center text-base font-semibold hover:text-black">
            <div className="flex justify-between items-center w-full pr-2">
              <span className="font-medium">Price</span>
              {price !== 'all' && (
                <span className="text-xs text-muted-foreground flex-shrink-0 group-data-[state=open]:hidden">
                  {prices.find((p) => p.value === price)?.name || price}
                </span>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-0">
            <div className="px-2 py-1 space-y-1">
              <Link
                href={getFilterUrl({ p: 'all' })}
                className={`flex items-center px-3 py-1.5 rounded-md hover:bg-blue-100 text-base ${price === 'all' ? 'bg-accent font-bold text-accent-foreground' : 'font-medium'}`}
              >
                {price === 'all' && (
                  <Check className="h-4 w-4 mr-2 flex-shrink-0" />
                )}
                <span className={price === 'all' ? 'ml-0' : 'ml-6'}>Any Price</span>
              </Link>
              
              {prices.map((p) => (
                <Link
                  key={p.value}
                  href={getFilterUrl({ p: p.value })}
                  className={`flex items-center px-3 py-1.5 rounded-md hover:bg-blue-100 text-base ${price === p.value ? 'bg-accent font-bold text-accent-foreground' : 'font-medium'}`}
                >
                  {price === p.value && (
                    <Check className="h-4 w-4 mr-2 flex-shrink-0" />
                  )}
                  <span className={price === p.value ? 'ml-0' : 'ml-6'}>{p.name}</span>
                </Link>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  };

  const ActiveFiltersBar = () => (
    <div className='flex flex-wrap items-center gap-2'>
      {q !== 'all' && q !== '' && (
        <Badge variant="secondary" className="text-sm px-3 py-1.5 flex-wrap">
          Search: {q}
        </Badge>
      )}
      
      {activeFilters.map((filter, index) => (
        <Badge 
          key={`${filter.type}-${index}`}
          variant="secondary" 
          className="text-sm px-3 py-1.5 gap-1.5 flex-wrap"
        >
          {filter.label}
          <Link href={filter.clearUrl} className="ml-1.5 hover:text-destructive">
            <X className="h-3.5 w-3.5" />
          </Link>
        </Badge>
      ))}
      
      {(q !== 'all' && q !== '') || activeFilters.length > 0 ? (
        <Button variant='outline' size="sm" asChild className="ml-auto">
          <Link href='/products' className="flex items-center gap-1">
            Clear All <X className="h-3.5 w-3.5" />
          </Link>
        </Button>
      ) : (
        <div className="text-muted-foreground">Showing all products</div>
      )}
    </div>
  );
  
  /* ----- UI ----- */
  return (
    <div className='container mx-auto px-4 py-4'>
      <div className='flex flex-col lg:flex-row gap-6'>
        {/* ------------- Mobile Filter Button ------------- */}
        <div className="block lg:hidden mb-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full flex items-center justify-between">
                <span className="flex items-center">
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                </span>
                {activeFilters.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFilters.length}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85vw] max-w-md overflow-y-auto">
              <SheetHeader className="mb-5">
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>
                  Narrow down your product search
                </SheetDescription>
              </SheetHeader>
              
              <FilterAccordion className="mb-6" />
              
              {(q !== 'all' && q !== '') || activeFilters.length > 0 ? (
                <Button variant='outline' size="sm" asChild className="mt-6 w-full">
                  <Link href='/products' className="flex items-center justify-center gap-1">
                    Clear All Filters <X className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              ) : null}
            </SheetContent>
          </Sheet>
        </div>
        
        {/* ------------- Active Filters (Mobile) ------------- */}
        <div className="lg:hidden">
          <div className="mb-4 overflow-x-auto pb-2 -mx-4 px-4">
            <div className="flex flex-nowrap gap-2 min-w-min">
              {activeFilters.length > 0 && activeFilters.map((filter, index) => (
                <Badge 
                  key={`mobile-${filter.type}-${index}`}
                  variant="secondary" 
                  className="text-sm whitespace-pre-wrap px-3 py-1.5 gap-1.5 max-w-[180px]"
                >
                  {filter.label}
                  <Link href={filter.clearUrl} className="ml-1.5 hover:text-destructive">
                    <X className="h-3.5 w-3.5 flex-shrink-0" />
                  </Link>
                </Badge>
              ))}
              
              {(q !== 'all' && q !== '') && (
                <Badge variant="secondary" className="text-sm whitespace-nowrap px-3 py-1.5">
                  Search: {q}
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        {/* ------------- Sidebar filters (desktop) ------------- */}
        <div className='hidden lg:block w-72 flex-shrink-0'>
          <Card className="sticky top-24 max-h-[calc(100vh-8rem)]">
            <CardHeader className="pb-4 border-b">
              <h2 className="text-lg font-semibold">Filtros</h2>
            </CardHeader>
            <CardContent className="p-0">
              {/* Scrollable accordion */}
              <ScrollArea className="px-4 py-6">
                <FilterAccordion />
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* ------------- Main grid ------------- */}
        <div className='flex-1 min-w-0'>
          {/* Active filters header (Desktop) */}
          <div className='hidden lg:block mb-6'>
            <ActiveFiltersBar />
          </div>

          {/* Results count */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-muted-foreground text-sm">
              {products.data.length} {products.data.length === 1 ? 'product' : 'products'} found
            </p>
          </div>

          {/* Product cards */}
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6'>
            {products.data.length === 0 && (
              <div className="col-span-full text-center py-10">
                <div className="text-muted-foreground mb-2">No products found</div>
                <Button variant='outline' asChild>
                  <Link href='/products'>Clear filters</Link>
                </Button>
              </div>
            )}
            
            {products.data.map((product: any) => (
              <ProductCard 
                key={product.id} 
                product={{
                  ...product,
                  // Ensure required properties are present
                  id: product.id || '',
                  name: product.name || '',
                  slug: product.slug || '',
                  price: product.price || 0,
                  rating: product.rating || 0,
                  images: Array.isArray(product.images) ? product.images : [],
                  brand: product.brand || '',
                  category: product.category || '',
                  inStock: product.inStock !== undefined ? product.inStock : true,
                }} 
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}