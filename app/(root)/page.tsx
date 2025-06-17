import {
  getLatestProducts,
  getFeaturedProducts,
} from '@/lib/actions/product.actions';
import ViewAllProductsButton from '@/components/view-all-products-button';
import Reveal from '@/components/ui/reveal';
import ProductList from '@/components/shared/product/product-list';
import FeaturedProductsScroll from '@/components/shared/featured-products-scroll';
import HomepageClientWrapper from '@/components/shared/homepage-client-wrapper';

// Force dynamic rendering and disable caching
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// Add cache busting headers
export const generateMetadata = async () => {
  return {
    title: 'Santa Fe - Home',
    description: 'Discover our latest high-quality meat products',
    alternates: {
      canonical: '/',
    },
    other: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    }
  };
};

const Homepage = async () => {
  // Fetch fresh data on every request
  const [latestProducts, featuredProducts] = await Promise.all([
    getLatestProducts(),
    getFeaturedProducts(),
  ]);

  return (
    <HomepageClientWrapper>
      <main className="flex flex-col pb-8 sm:pb-12 md:pb-16">
        {/* Featured Products Scroll Section */}
        {featuredProducts.length > 0 && (
          <section className="w-full">
            <FeaturedProductsScroll products={featuredProducts} />
          </section>
        )}
        
        {/* Latest Products Section */}
        <Reveal>
          <section className="wrapper">
            <Reveal direction="up">
              <div className="mb-6 sm:mb-8 text-center sm:text-left">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-heading tracking-tight mb-2 sm:mb-3">
                  Newest Arrivals
                </h2>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Discover our latest high-quality meat products
                </p>
              </div>
            </Reveal>
            
            <ProductList data={latestProducts} limit={4} />
            
            <Reveal direction="up" delay={300}>
              <div className="mt-6 sm:mt-8 md:mt-10 flex justify-center">
                <ViewAllProductsButton />
              </div>
            </Reveal>
          </section>
        </Reveal>
      </main>
    </HomepageClientWrapper>
  );
};

export default Homepage;
