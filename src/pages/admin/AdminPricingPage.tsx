/**
 * Phase 10 - Admin Pricing Page
 * Pricing tier management calling admin.getPricingTiers, admin.updatePricingTier.
 * Includes price history log.
 */
import React from 'react';
import { PoundSterling, TrendingUp, Clock, Edit3, Save } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.trust-agent.ai';

interface PriceHistoryEntry {
  id: string;
  oldPrice: number;
  newPrice: number;
  changedBy: string;
  note: string | null;
  changedAt: string;
}

interface PricingTier {
  id: string;
  name: string;
  slug: string;
  priceGBP: number;
  pricePreviousGBP: number | null;
  isActive: boolean;
  features: string[];
  priceHistory: PriceHistoryEntry[];
}

export function AdminPricingPage() {
  const [tiers, setTiers] = React.useState<PricingTier[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [editingTier, setEditingTier] = React.useState<string | null>(null);
  const [editPrice, setEditPrice] = React.useState('');
  const [editNote, setEditNote] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [expandedHistory, setExpandedHistory] = React.useState<string | null>(null);

  const token = localStorage.getItem('ta_access_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  async function loadTiers() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/trpc/admin.getPricingTiers`, { headers });
      const json = await res.json();
      setTiers(json.result?.data ?? []);
    } catch {
      setError('Unable to load pricing tiers');
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    loadTiers();
  }, []);

  async function handleSavePrice(tierId: string) {
    const price = parseFloat(editPrice);
    if (isNaN(price) || price <= 0) return;
    setSaving(true);
    try {
      await fetch(`${API_BASE}/trpc/admin.updatePricingTier`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ tierId, priceGBP: price, note: editNote || undefined }),
      });
      setEditingTier(null);
      setEditPrice('');
      setEditNote('');
      loadTiers();
    } catch {
      setError('Failed to update pricing tier');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <PoundSterling size={20} style={{ color: '#FFB740' }} />
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#E8EDF5', margin: 0, fontFamily: 'var(--font-sans)' }}>
          Pricing Management
        </h1>
      </div>

      {error && (
        <div style={{ padding: 12, background: 'rgba(255,0,64,0.1)', borderRadius: 8, color: '#FF6B6B', fontSize: 13, marginBottom: 16, fontFamily: 'var(--font-sans)' }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-sans)' }}>
          Loading pricing tiers...
        </div>
      )}

      {!loading && tiers.length === 0 && (
        <Card style={{ padding: 32, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0, fontFamily: 'var(--font-sans)' }}>
            No pricing tiers configured yet.
          </p>
        </Card>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {tiers.map((tier) => (
          <Card key={tier.id} style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#E8EDF5', margin: 0, fontFamily: 'var(--font-sans)' }}>
                  {tier.name}
                </h3>
                <Badge variant={tier.isActive ? 'success' : 'error'}>
                  {tier.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {tier.pricePreviousGBP !== null && tier.pricePreviousGBP !== tier.priceGBP && (
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through', fontFamily: 'var(--font-sans)' }}>
                    {'\u00A3'}{tier.pricePreviousGBP.toFixed(2)}
                  </span>
                )}
                <span style={{ fontSize: 24, fontWeight: 800, color: '#FFB740', fontFamily: 'var(--font-sans)' }}>
                  {'\u00A3'}{tier.priceGBP.toFixed(2)}
                </span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-sans)' }}>/month</span>
              </div>
            </div>

            {/* Edit Price */}
            {editingTier === tier.id ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 12, flexWrap: 'wrap' }}>
                <div style={{ width: 120 }}>
                  <Input
                    label="New Price (GBP)"
                    type="number"
                    step="0.01"
                    min="0"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    icon={<PoundSterling size={12} />}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <Input
                    label="Note (optional)"
                    placeholder="Reason for change..."
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                  />
                </div>
                <Button size="sm" loading={saving} onClick={() => handleSavePrice(tier.id)} icon={<Save size={12} />}>
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingTier(null)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setEditingTier(tier.id);
                  setEditPrice(tier.priceGBP.toString());
                  setEditNote('');
                }}
                icon={<Edit3 size={12} />}
                style={{ marginBottom: 12 }}
              >
                Edit Price
              </Button>
            )}

            {/* Price History */}
            {tier.priceHistory.length > 0 && (
              <div>
                <button
                  onClick={() => setExpandedHistory(expandedHistory === tier.id ? null : tier.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.4)',
                    fontSize: 11,
                    fontFamily: 'var(--font-sans)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: 0,
                  }}
                >
                  <Clock size={11} />
                  {tier.priceHistory.length} price change{tier.priceHistory.length > 1 ? 's' : ''}
                  <TrendingUp size={10} />
                </button>

                {expandedHistory === tier.id && (
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {tier.priceHistory.map((entry) => (
                      <div
                        key={entry.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '6px 10px',
                          background: 'rgba(255,255,255,0.02)',
                          borderRadius: 6,
                          fontSize: 11,
                          fontFamily: 'var(--font-sans)',
                        }}
                      >
                        <span style={{ color: 'rgba(255,255,255,0.3)' }}>
                          {new Date(entry.changedAt).toLocaleDateString('en-GB')}
                        </span>
                        <span style={{ color: '#FF6B6B' }}>
                          {'\u00A3'}{entry.oldPrice.toFixed(2)}
                        </span>
                        <span style={{ color: 'rgba(255,255,255,0.3)' }}>{'>'}</span>
                        <span style={{ color: '#00AA78' }}>
                          {'\u00A3'}{entry.newPrice.toFixed(2)}
                        </span>
                        {entry.note && (
                          <span style={{ color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' }}>
                            {entry.note}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
