import React from 'react';
import { Search, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';

export interface RoleListItem {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  category: string;
  trustScore: number;
  trustBadge: 'PLATINUM' | 'GOLD' | 'SILVER' | 'BASIC';
  priceMonthly: number; // pence
  companionName: string;
  avatarUrl?: string;
  accentColor?: string;
}

type SortOption = 'trust' | 'price-low' | 'price-high' | 'name';

interface RoleGridProps {
  roles: RoleListItem[];
  categories?: string[];
  isLoading?: boolean;
  hasMore?: boolean;
  onRoleClick: (roleId: string) => void;
  onLoadMore?: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  all: 'All',
  education: 'Education',
  'health-wellness': 'Health',
  'elderly-care': 'Elderly Care',
  'food-lifestyle': 'Food & Lifestyle',
  'legal-financial': 'Legal & Financial',
  'creative-professional': 'Creative',
  childrens: "Children's",
  enterprise: 'Enterprise',
};

const BADGE_VARIANT: Record<string, 'platinum' | 'gold' | 'silver' | 'basic'> = {
  PLATINUM: 'platinum',
  GOLD: 'gold',
  SILVER: 'silver',
  BASIC: 'basic',
};

function formatPrice(pence: number): string {
  if (pence === 0) return 'Free';
  const pounds = (pence / 100).toFixed(2);
  return `\u00A3${pounds}/mo`;
}

export function RoleGrid({
  roles,
  categories,
  isLoading,
  hasMore,
  onRoleClick,
  onLoadMore,
}: RoleGridProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeCategory, setActiveCategory] = React.useState('all');
  const [sortBy, setSortBy] = React.useState<SortOption>('trust');
  const [showSort, setShowSort] = React.useState(false);

  const allCategories = categories || Object.keys(CATEGORY_LABELS);

  // Filter
  const filtered = roles.filter((role) => {
    const matchesCategory = activeCategory === 'all' || role.category === activeCategory;
    const matchesSearch =
      !searchQuery ||
      role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.companionName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'trust':
        return b.trustScore - a.trustScore;
      case 'price-low':
        return a.priceMonthly - b.priceMonthly;
      case 'price-high':
        return b.priceMonthly - a.priceMonthly;
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const sortLabel =
    sortBy === 'trust'
      ? 'Trust Score'
      : sortBy === 'price-low'
        ? 'Price: Low-High'
        : sortBy === 'price-high'
          ? 'Price: High-Low'
          : 'Name';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      {/* Search bar */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '0 4px' }}>
        <div style={{ flex: 1 }}>
          <Input
            placeholder="Search roles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search size={14} />}
          />
        </div>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowSort(!showSort)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '8px 12px',
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              fontSize: 12,
              fontFamily: 'var(--font-sans)',
              fontWeight: 500,
              whiteSpace: 'nowrap',
            }}
          >
            <SlidersHorizontal size={12} />
            {sortLabel}
            <ChevronDown size={12} />
          </button>
          {showSort && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 4,
                background: 'var(--color-surface-1)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                zIndex: 10,
                minWidth: 160,
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              {(['trust', 'price-low', 'price-high', 'name'] as SortOption[]).map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    setSortBy(opt);
                    setShowSort(false);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px 14px',
                    background: opt === sortBy ? 'var(--color-surface-2)' : 'transparent',
                    border: 'none',
                    color: opt === sortBy ? 'var(--color-electric-blue)' : '#E8EDF5',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontFamily: 'var(--font-sans)',
                    textAlign: 'left',
                  }}
                >
                  {opt === 'trust' && 'Trust Score'}
                  {opt === 'price-low' && 'Price: Low-High'}
                  {opt === 'price-high' && 'Price: High-Low'}
                  {opt === 'name' && 'Name'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category filter tabs */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          overflowX: 'auto',
          padding: '0 4px',
          flexShrink: 0,
        }}
      >
        {allCategories.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '5px 12px',
                borderRadius: '100px',
                background: isActive ? 'var(--color-electric-blue)' : 'var(--color-surface-2)',
                border: 'none',
                color: isActive ? '#fff' : 'var(--color-text-muted)',
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 600,
                fontFamily: 'var(--font-sans)',
                whiteSpace: 'nowrap',
                transition: 'all 150ms ease',
              }}
            >
              {CATEGORY_LABELS[cat] || cat}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 4px',
        }}
      >
        {isLoading && sorted.length === 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                style={{
                  height: 180,
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--color-surface-1)',
                  border: '1px solid var(--color-border)',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 40,
              fontSize: 13,
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            No roles found matching your search.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 10,
            }}
          >
            {sorted.map((role) => (
              <RoleCard key={role.id} role={role} onClick={() => onRoleClick(role.id)} />
            ))}
          </div>
        )}

        {/* Load more */}
        {hasMore && !isLoading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
            <button
              onClick={onLoadMore}
              style={{
                padding: '8px 24px',
                background: 'transparent',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-electric-blue)',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                fontFamily: 'var(--font-sans)',
              }}
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function RoleCard({ role, onClick }: { role: RoleListItem; onClick: () => void }) {
  const accent = role.accentColor || 'var(--color-electric-blue)';

  return (
    <Card onClick={onClick} padding="0">
      {/* Accent top bar */}
      <div style={{ height: 3, background: accent, borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0' }} />

      <div style={{ padding: '14px 16px' }}>
        {/* Avatar and badges */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
          {role.avatarUrl ? (
            <img
              src={role.avatarUrl}
              alt={role.name}
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-md)',
                flexShrink: 0,
                objectFit: 'cover',
              }}
            />
          ) : (
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-md)',
                background: `${accent}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                fontWeight: 800,
                color: accent,
                fontFamily: 'var(--font-sans)',
                flexShrink: 0,
              }}
            >
              {role.name.charAt(0)}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#E8EDF5',
                fontFamily: 'var(--font-sans)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {role.name}
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--color-text-muted)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {role.companionName}
            </div>
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 12,
            color: 'var(--color-text-muted)',
            lineHeight: 1.5,
            marginBottom: 10,
            fontFamily: 'var(--font-sans)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {role.tagline}
        </div>

        {/* Trust badge and price */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Badge variant={BADGE_VARIANT[role.trustBadge] || 'basic'}>
              {role.trustBadge}
            </Badge>
            <Badge variant="trust" value={role.trustScore} />
          </div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: role.priceMonthly === 0 ? 'var(--color-success)' : '#E8EDF5',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {formatPrice(role.priceMonthly)}
          </span>
        </div>
      </div>
    </Card>
  );
}

export default RoleGrid;
