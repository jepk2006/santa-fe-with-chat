import ProductCard from '@/components/shared/product/product-card';
import { Button } from '@/components/ui/button';
import {
  getAllProducts,
  getAllCategories,
} from '@/lib/actions/product.actions';
import Link from 'next/link';
import { Metadata } from 'next';
import { Sliders, ChevronDown, ChevronUp, Check, X, DollarSign, Star, Filter } from 'lucide-react';
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
        ? `Search ${isQuerySet ? q : ''} \
${isCategorySet ? `: Category ${category}` : ''}\
${isPriceSet ? `: Price ${price}` : ''}\
${isRatingSet ? `: Rating ${rating}` : ''}`
        : 'Search Products',
  };
}

/* ---------- page component ---------- */
type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function SearchPage({ searchParams }: PageProps) {
  const {
    q = 'all',
    category = 'all',
    price = 'all',
    rating = 'all',
    page = '1',
  } = await searchParams;

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
    return `/search?${new URLSearchParams(params as Record<string, string>).toString()}`;
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
  const FilterAccordion = ({ className = '' }: { className?: string }) => (
    <Accordion type="multiple" defaultValue={[]} className={`space-y-2 ${className}`}>
      {/* Categories Accordion */}
      <AccordionItem value="categories" className="border rounded-lg">
        <AccordionTrigger className="px-4 hover:no-underline hover:bg-secondary rounded-t-lg group">
          <div className="flex justify-between items-center w-full pr-2">
            <span className="font-medium">Categories</span>
            {category !== 'all' && category !== '' && (
              <span className="text-xs text-muted-foreground flex-shrink-0 group-data-[state=open]:hidden">
                {category}
              </span>
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-0">
          <div className="px-2 py-1 space-y-1 max-h-60 overflow-y-auto scrollbar-thin">
            <Link
              href={getFilterUrl({ c: 'all' })}
              className={`flex items-center px-3 py-1.5 rounded-md hover:bg-secondary ${(category === 'all' || category === '') ? 'bg-accent font-medium text-accent-foreground' : ''}`}
            >
              {(category === 'all' || category === '') && (
                <Check className="h-4 w-4 mr-2 flex-shrink-0" />
              )}
              <span className={category === 'all' || category === '' ? 'ml-0' : 'ml-6'}>All Categories</span>
            </Link>
            
            {categories.map((x) => (
              <Link
                key={x.category}
                href={getFilterUrl({ c: x.category })}
                className={`flex items-center px-3 py-1.5 rounded-md hover:bg-secondary ${category === x.category ? 'bg-accent font-medium text-accent-foreground' : ''}`}
              >
                {category === x.category && (
                  <Check className="h-4 w-4 mr-2 flex-shrink-0" />
                )}
                <span className={category === x.category ? 'ml-0' : 'ml-6'}>{x.category}</span>
              </Link>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
      
      {/* Price Accordion */}
      <AccordionItem value="price" className="border rounded-lg">
        <AccordionTrigger className="px-4 hover:no-underline hover:bg-secondary rounded-t-lg group">
          <div className="flex justify-between items-center w-full pr-2">
            <span className="font-medium flex items-center gap-1">
              <DollarSign className="h-4 w-4" /> Price
            </span>
            {price !== 'all' && (
              <span className="text-xs text-muted-foreground flex-shrink-0 group-data-[state=open]:hidden">
                {prices.find(p => p.value === price)?.name || price}
              </span>
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-0">
          <div className="px-2 py-1 space-y-1">
            <Link
              href={getFilterUrl({ p: 'all' })}
              className={`flex items-center px-3 py-1.5 rounded-md hover:bg-secondary ${price === 'all' ? 'bg-accent font-medium text-accent-foreground' : ''}`}
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
                className={`flex items-center px-3 py-1.5 rounded-md hover:bg-secondary ${price === p.value ? 'bg-accent font-medium text-accent-foreground' : ''}`}
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
      
      {/* Rating Accordion */}
      <AccordionItem value="rating" className="border rounded-lg">
        <AccordionTrigger className="px-4 hover:no-underline hover:bg-secondary rounded-t-lg group">
          <div className="flex justify-between items-center w-full pr-2">
            <span className="font-medium flex items-center gap-1">
              <Star className="h-4 w-4" /> Rating
            </span>
            {rating !== 'all' && (
              <span className="text-xs text-muted-foreground flex-shrink-0 flex items-center group-data-[state=open]:hidden">
                {Array(parseInt(rating)).fill(0).map((_, i) => (
                  <Star key={i} className="inline h-3 w-3 fill-primary text-primary" />
                ))}
                <span className="ml-1">&amp; up</span>
              </span>
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-0">
          <div className="px-2 py-1 space-y-1">
            <Link
              href={getFilterUrl({ r: 'all' })}
              className={`flex items-center px-3 py-1.5 rounded-md hover:bg-secondary ${rating === 'all' ? 'bg-accent font-medium text-accent-foreground' : ''}`}
            >
              {rating === 'all' && (
                <Check className="h-4 w-4 mr-2 flex-shrink-0" />
              )}
              <span className={rating === 'all' ? 'ml-0' : 'ml-6'}>Any Rating</span>
            </Link>
            
            {ratings.map((r) => (
              <Link
                key={r}
                href={getFilterUrl({ r: `${r}` })}
                className={`flex items-center px-3 py-1.5 rounded-md hover:bg-secondary ${rating === r.toString() ? 'bg-accent font-medium text-accent-foreground' : ''}`}
              >
                {rating === r.toString() && (
                  <Check className="h-4 w-4 mr-2 flex-shrink-0" />
                )}
                <span className={rating === r.toString() ? 'ml-0' : 'ml-6'}>
                  {Array(r).fill(0).map((_, i) => (
                    <Star key={i} className="inline h-3.5 w-3.5 fill-primary text-primary" />
                  ))}
                  <span className="ml-1">{`& up`}</span>
                </span>
              </Link>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );

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
          <Link href='/search' className="flex items-center gap-1">
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
                  <Link href='/search' className="flex items-center justify-center gap-1">
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
          <Card className="sticky top-24">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Sliders className="h-5 w-5" /> 
                Filters
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Click on a section to expand filter options
              </p>
            </CardHeader>
            <CardContent className="pb-6">
              <FilterAccordion />
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
                  <Link href='/search'>Clear filters</Link>
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
