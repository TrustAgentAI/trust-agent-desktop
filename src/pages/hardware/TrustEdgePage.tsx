/**
 * Phase 9 - TrustEdge Enterprise Hardware Page
 * Enterprise-grade AI appliance at 999 GBP.
 */
import { Server, Cpu, Wifi, Shield, Zap, HardDrive, Network, CheckCircle, Building2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

const SPECS = [
  { label: 'Processor', value: 'Intel N100 Quad-Core 3.4GHz + NPU', icon: Cpu },
  { label: 'Memory', value: '16GB DDR5', icon: Zap },
  { label: 'Storage', value: '512GB NVMe SSD + expansion bay', icon: HardDrive },
  { label: 'Network', value: 'Dual Gigabit Ethernet, Wi-Fi 6E', icon: Network },
  { label: 'Connectivity', value: 'Bluetooth 5.3, 4x USB 3.2, HDMI 2.1', icon: Wifi },
  { label: 'Security', value: 'TPM 2.0, Intel TXT, FIPS 140-2 ready', icon: Shield },
];

const FEATURES = [
  'Serve up to 200 concurrent AI companion sessions',
  'On-premises deployment - data never leaves your building',
  'Active Directory / LDAP integration',
  'NHS DSPT and ISO 27001 compliant',
  'Redundant storage with RAID support',
  'Remote management via secure admin portal',
  'Automatic failover to cloud backup',
  'Priority 4-hour SLA enterprise support',
  'Custom model fine-tuning capability',
  'Multi-site mesh networking support',
];

const USE_CASES = [
  { title: 'NHS Trusts', desc: 'Deploy across wards - patient companions that stay on-site' },
  { title: 'Schools & MATs', desc: 'One device per school - 500 students, zero cloud dependency' },
  { title: 'Care Homes', desc: 'Resident companions accessible from communal and private rooms' },
  { title: 'Enterprise', desc: 'Employee wellbeing and training companions behind your firewall' },
];

export function TrustEdgePage() {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
      {/* Hero */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: 40,
          padding: '48px 24px',
          background: 'linear-gradient(135deg, rgba(0,212,255,0.08), rgba(30,111,255,0.06))',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <Server size={40} style={{ color: 'var(--color-ion-cyan)', marginBottom: 12 }} />
        <Badge variant="platinum">Enterprise</Badge>
        <h1 style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-sans)', color: '#E8EDF5', margin: '12px 0 8px' }}>
          TrustEdge
        </h1>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', margin: '0 0 20px', fontFamily: 'var(--font-sans)' }}>
          Enterprise-grade AI infrastructure. On-premises. Air-gapped. Unstoppable.
        </p>
        <div style={{ fontSize: 40, fontWeight: 800, color: 'var(--color-ion-cyan)', fontFamily: 'var(--font-sans)' }}>
          {'\u00A3'}999
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-sans)' }}>
          Per unit - Volume discounts available for 10+ units
        </div>
        <Button style={{ marginTop: 20 }} size="lg">
          Request Enterprise Quote
        </Button>
      </div>

      {/* Specs */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#E8EDF5', marginBottom: 16, fontFamily: 'var(--font-sans)' }}>
          Technical Specifications
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
          {SPECS.map((spec) => (
            <Card key={spec.label} style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <spec.icon size={16} style={{ color: 'var(--color-ion-cyan)' }} />
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
                    {spec.label}
                  </div>
                  <div style={{ fontSize: 13, color: '#E8EDF5', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
                    {spec.value}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Features */}
      <Card style={{ marginBottom: 40, padding: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#E8EDF5', marginBottom: 16, fontFamily: 'var(--font-sans)', marginTop: 0 }}>
          Enterprise Features
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 10 }}>
          {FEATURES.map((feat) => (
            <div key={feat} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <CheckCircle size={14} style={{ color: 'var(--color-ion-cyan)', marginTop: 2, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-sans)', lineHeight: 1.4 }}>
                {feat}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Use Cases */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Building2 size={16} style={{ color: '#FFB740' }} />
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#E8EDF5', margin: 0, fontFamily: 'var(--font-sans)' }}>
            Designed For
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {USE_CASES.map((uc) => (
            <Card key={uc.title} style={{ padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#E8EDF5', margin: '0 0 6px', fontFamily: 'var(--font-sans)' }}>
                {uc.title}
              </h3>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.5, fontFamily: 'var(--font-sans)' }}>
                {uc.desc}
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* In the Box */}
      <Card style={{ padding: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#E8EDF5', marginBottom: 12, fontFamily: 'var(--font-sans)', marginTop: 0 }}>
          In the Box
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {[
            'TrustEdge Appliance',
            'Rack Mount Kit',
            'Dual Power Supplies',
            '2x Ethernet Cables',
            'Admin Setup Guide',
            'Deployment Handbook',
            '3-Year Warranty',
            'Priority Support Card',
          ].map((item) => (
            <Badge key={item} variant="default">{item}</Badge>
          ))}
        </div>
      </Card>
    </div>
  );
}
