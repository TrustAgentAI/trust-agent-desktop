/**
 * CompanionsPage - Phase 3: Marketplace
 * /companions route with:
 * - Category sidebar from roles.getCategories
 * - Search input calling roles.search
 * - Role grid using roles.listPublished (real DB data)
 * - CompanionCard components (4 elements only)
 *
 * ALL data from real tRPC. No hardcoded arrays.
 */
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { trpc } from '@/lib/trpc';
import { useTrpcQuery } from '@/lib/useTrpcQuery';
import { CompanionCard } from '@/components/companions/CompanionCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

interface CategoryItem {
  name: string;
  count: number;
}

interface RoleCardDisplay {
  id: string;
  slug: string;
  companionName: string;
  tagline: string;
  category: string;
  emoji?: string | null;
  priceMonthly: number;
  audit?: { trustScore: number; badge: string; totalScore: number } | null;
}

interface RolesResult {
  roles: RoleCardDisplay[];
  total: number;
  page: number;
  totalPages: number;
}

/* ─── Category sidebar ─── */
function CategorySidebar({
  categories,
  activeCategory,
  onSelect,
}: {
  categories: CategoryItem[];
  activeCategory: string | null;
  onSelect: (cat: string | null) => void;
}) {
  return (
    <nav
      aria-label="Categories"
      style={{
        width: 220,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-1)',
      }}
    >
      <h3
        style={{
          fontSize: 11,
          fontWeight: 700,
          fontFamily: 'var(--font-sans)',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 'var(--space-2)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
        }}
      >
        <Filter size={14} /> Categories
      </h3>

      <button
        onClick={() => onSelect(null)}
        style={{
          textAlign: 'left',
          padding: 'var(--space-2) var(--space-3)',
          background: activeCategory === null ? 'var(--primary-50)' : 'transparent',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: activeCategory === null ? 600 : 400,
          fontFamily: 'var(--font-sans)',
          color: activeCategory === null ? 'var(--primary-700)' : 'var(--text-secondary)',
          transition: 'background var(--transition-fast)',
          minHeight: 44,
        }}
      >
        All companions
      </button>

      {categories.map((cat) => (
        <button
          key={cat.name}
          onClick={() => onSelect(cat.name)}
          style={{
            textAlign: 'left',
            padding: 'var(--space-2) var(--space-3)',
            background: activeCategory === cat.name ? 'var(--primary-50)' : 'transparent',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: activeCategory === cat.name ? 600 : 400,
            fontFamily: 'var(--font-sans)',
            color: activeCategory === cat.name ? 'var(--primary-700)' : 'var(--text-secondary)',
            transition: 'background var(--transition-fast)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            minHeight: 44,
            textTransform: 'capitalize',
          }}
        >
          <span>{cat.name}</span>
          <span
            style={{
              fontSize: 11,
              fontFamily: 'var(--font-sans)',
              color: 'var(--text-muted)',
            }}
          >
            {cat.count}
          </span>
        </button>
      ))}
    </nav>
  );
}

/* ─── Search bar ─── */
function SearchBar({
  value,
  onChange,
  onSearch,
}: {
  value: string;
  onChange: (val: string) => void;
  onSearch: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 'var(--space-2)',
        marginBottom: 'var(--space-6)',
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          padding: '0 var(--space-3)',
          transition: 'border-color var(--transition-fast)',
        }}
      >
        <Search size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSearch();
          }}
          placeholder="Search companions by name, skill, or category..."
          aria-label="Search companions"
          style={{
            flex: 1,
            border: 'none',
            background: 'transparent',
            padding: 'var(--space-3)',
            fontSize: 14,
            fontFamily: 'var(--font-sans)',
            color: 'var(--text-primary)',
            outline: 'none',
            minHeight: 44,
          }}
        />
      </div>
      <button
        onClick={onSearch}
        aria-label="Search"
        style={{
          padding: 'var(--space-3) var(--space-5)',
          background: 'var(--primary-600)',
          color: 'var(--text-inverse)',
          fontFamily: 'var(--font-sans)',
          fontWeight: 600,
          fontSize: 14,
          border: 'none',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          minHeight: 44,
        }}
      >
        Search
      </button>
    </div>
  );
}

/* ─── Pagination ─── */
function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 'var(--space-3)',
        marginTop: 'var(--space-8)',
      }}
    >
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-1)',
          padding: 'var(--space-2) var(--space-3)',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          cursor: page <= 1 ? 'default' : 'pointer',
          opacity: page <= 1 ? 0.5 : 1,
          fontSize: 13,
          fontFamily: 'var(--font-sans)',
          color: 'var(--text-secondary)',
          minHeight: 44,
        }}
      >
        <ChevronLeft size={16} /> Previous
      </button>

      <span
        style={{
          fontSize: 13,
          fontFamily: 'var(--font-sans)',
          color: 'var(--text-muted)',
        }}
      >
        Page {page} of {totalPages}
      </span>

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-1)',
          padding: 'var(--space-2) var(--space-3)',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          cursor: page >= totalPages ? 'default' : 'pointer',
          opacity: page >= totalPages ? 0.5 : 1,
          fontSize: 13,
          fontFamily: 'var(--font-sans)',
          color: 'var(--text-secondary)',
          minHeight: 44,
        }}
      >
        Next <ChevronRight size={16} />
      </button>
    </div>
  );
}

/* ─── Skeleton grid ─── */
function RoleGridSkeleton() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: 'var(--space-5)',
      }}
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} style={{ borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
          <Skeleton height={120} />
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Skeleton height={18} width="60%" />
            <Skeleton height={14} width="80%" />
            <Skeleton height={6} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Empty state ─── */
function EmptyResults({ query }: { query?: string }) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: 'var(--space-16) var(--space-6)',
      }}
    >
      <div
        style={{
          fontSize: 48,
          marginBottom: 'var(--space-4)',
        }}
      >
        🔍
      </div>
      <h3
        style={{
          fontSize: 18,
          fontWeight: 700,
          fontFamily: 'var(--font-sans)',
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-2)',
        }}
      >
        {query ? `No companions found for "${query}"` : 'No companions available yet'}
      </h3>
      <p
        style={{
          fontSize: 14,
          fontFamily: 'var(--font-sans)',
          color: 'var(--text-muted)',
        }}
      >
        {query
          ? 'Try a different search term or browse by category.'
          : 'Companions are being added daily. Check back soon.'}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════ */
/* MAIN COMPANIONS PAGE                                   */
/* ═══════════════════════════════════════════════════════ */
export function CompanionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category');
  const [activeCategory, setActiveCategory] = React.useState<string | null>(initialCategory);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchActive, setSearchActive] = React.useState(false);
  const [page, setPage] = React.useState(1);

  // Real data from tRPC
  const categories = useTrpcQuery(
    () => trpc.roles.getCategories.query(),
    [],
  );

  const rolesResult = useTrpcQuery(
    () =>
      trpc.roles.listPublished.query({
        page,
        limit: 20,
        ...(activeCategory ? { category: activeCategory } : {}),
      }) as Promise<RolesResult>,
    [page, activeCategory],
  );

  const searchResult = useTrpcQuery(
    () =>
      searchActive && searchQuery.trim().length > 0
        ? (trpc.roles.search.query({ query: searchQuery.trim(), limit: 20 }) as Promise<RoleCardDisplay[]>)
        : Promise.resolve(null),
    [searchActive, searchQuery],
  );

  const handleCategorySelect = (cat: string | null) => {
    setActiveCategory(cat);
    setPage(1);
    setSearchActive(false);
    setSearchQuery('');
    if (cat) {
      setSearchParams({ category: cat });
    } else {
      setSearchParams({});
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim().length > 0) {
      setSearchActive(true);
      setActiveCategory(null);
      setSearchParams({});
    }
  };

  // Determine which roles to show
  const displayRoles: RoleCardDisplay[] = searchActive && searchResult.data
    ? searchResult.data
    : (rolesResult.data?.roles ?? []);
  const isLoading = searchActive ? searchResult.isLoading : rolesResult.isLoading;
  const totalPages = searchActive ? 1 : (rolesResult.data?.totalPages ?? 1);
  const totalCount = searchActive
    ? (searchResult.data?.length ?? 0)
    : (rolesResult.data?.total ?? 0);

  return (
    <div
      style={{
        background: 'var(--bg-page)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Page header */}
      <div
        style={{
          padding: 'var(--space-8) var(--space-6) var(--space-4)',
          maxWidth: 1280,
          margin: '0 auto',
          width: '100%',
        }}
      >
        <h1
          style={{
            fontSize: 32,
            fontWeight: 700,
            fontFamily: 'var(--font-serif)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-2)',
          }}
        >
          Companion Marketplace
        </h1>
        <p
          style={{
            fontSize: 15,
            fontFamily: 'var(--font-sans)',
            color: 'var(--text-secondary)',
            marginBottom: 'var(--space-6)',
          }}
        >
          {totalCount} companion{totalCount !== 1 ? 's' : ''} - all independently audited for safety and trust.
        </p>
      </div>

      {/* Main content with sidebar */}
      <div
        style={{
          flex: 1,
          maxWidth: 1280,
          margin: '0 auto',
          width: '100%',
          padding: '0 var(--space-6) var(--space-8)',
          display: 'flex',
          gap: 'var(--space-8)',
        }}
      >
        {/* Sidebar - categories */}
        <div
          style={{
            display: 'none',
          }}
          className="companions-sidebar"
        >
          <CategorySidebar
            categories={categories.data ?? []}
            activeCategory={activeCategory}
            onSelect={handleCategorySelect}
          />
        </div>

        {/* Desktop sidebar (shown via inline media query workaround) */}
        {typeof window !== 'undefined' && window.innerWidth >= 768 && (
          <CategorySidebar
            categories={categories.data ?? []}
            activeCategory={activeCategory}
            onSelect={handleCategorySelect}
          />
        )}

        {/* Main grid */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Search */}
          <SearchBar
            value={searchQuery}
            onChange={(val) => {
              setSearchQuery(val);
              if (val.trim().length === 0) {
                setSearchActive(false);
              }
            }}
            onSearch={handleSearch}
          />

          {/* Active filter pills */}
          {(activeCategory || searchActive) && (
            <div
              style={{
                display: 'flex',
                gap: 'var(--space-2)',
                marginBottom: 'var(--space-4)',
                flexWrap: 'wrap',
              }}
            >
              {activeCategory && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    padding: 'var(--space-1) var(--space-3)',
                    background: 'var(--primary-50)',
                    color: 'var(--primary-700)',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: 13,
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 500,
                    textTransform: 'capitalize',
                  }}
                >
                  {activeCategory}
                  <button
                    onClick={() => handleCategorySelect(null)}
                    aria-label={`Remove ${activeCategory} filter`}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--primary-600)',
                      fontSize: 16,
                      lineHeight: 1,
                      padding: 0,
                      minHeight: 44,
                      minWidth: 44,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    &times;
                  </button>
                </span>
              )}
              {searchActive && searchQuery && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    padding: 'var(--space-1) var(--space-3)',
                    background: 'var(--primary-50)',
                    color: 'var(--primary-700)',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: 13,
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 500,
                  }}
                >
                  Search: {searchQuery}
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSearchActive(false);
                    }}
                    aria-label="Clear search"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--primary-600)',
                      fontSize: 16,
                      lineHeight: 1,
                      padding: 0,
                      minHeight: 44,
                      minWidth: 44,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    &times;
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Loading state */}
          {isLoading && <RoleGridSkeleton />}

          {/* Empty state */}
          {!isLoading && displayRoles.length === 0 && (
            <EmptyResults query={searchActive ? searchQuery : undefined} />
          )}

          {/* Role grid */}
          {!isLoading && displayRoles.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 'var(--space-5)',
              }}
            >
              {displayRoles.map((role) => (
                <CompanionCard
                  key={role.id}
                  slug={role.slug}
                  companionName={role.companionName}
                  tagline={role.tagline}
                  category={role.category}
                  emoji={role.emoji ?? null}
                  trustScore={role.audit?.trustScore ?? 0}
                  badge={role.audit?.badge ?? 'BASIC'}
                  priceMonthly={role.priceMonthly}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!searchActive && (
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </div>
      </div>
    </div>
  );
}
