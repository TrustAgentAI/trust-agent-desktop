/**
 * Phase 9 - TrustBox Pro Hardware Page
 * Full spec, pricing, features for the TrustBox Pro at 449 GBP.
 */
import { Box, Cpu, Wifi, Shield, Zap, HardDrive, Monitor, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

const SPECS = [
  { label: 'Processor', value: 'ARM Cortex-A76 Quad-Core 2.4GHz', icon: Cpu },
  { label: 'Memory', value: '8GB LPDDR4X', icon: Zap },
  { label: 'Storage', value: '128GB eMMC + microSD slot', icon: HardDrive },
  { label: 'Connectivity', value: 'Wi-Fi 6E, Bluetooth 5.3, Gigabit Ethernet', icon: Wifi },
  { label: 'Display Output', value: 'HDMI 2.0, USB-C DisplayPort', icon: Monitor },
  { label: 'Security', value: 'TPM 2.0, Secure Boot, Hardware Encryption', icon: Shield },
];

const FEATURES = [
  'Runs your AI companions 100% locally - no cloud dependency',
  'Automatic encrypted backups to Trust Agent cloud',
  'Voice activation with wake-word detection',
  'Parental controls and family sharing built in',
  'Automatic security updates over-the-air',
  'NHS DSPT compliant for healthcare deployments',
  'Works offline - full companion access without internet',
  'Silent operation - 0dB fanless design',
];

export function TrustBoxPage() {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
      {/* Hero */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: 40,
          padding: '48px 24px',
          background: 'linear-gradient(135deg, rgba(30,111,255,0.1), rgba(0,212,255,0.05))',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <Box size={40} style={{ color: 'var(--color-electric-blue)', marginBottom: 12 }} />
        <Badge variant="info">Hardware</Badge>
        <h1 style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-sans)', color: '#E8EDF5', margin: '12px 0 8px' }}>
          TrustBox Pro
        </h1>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', margin: '0 0 20px', fontFamily: 'var(--font-sans)' }}>
          Your AI companions, running locally. Private. Powerful. Always on.
        </p>
        <div style={{ fontSize: 40, fontWeight: 800, color: 'var(--color-electric-blue)', fontFamily: 'var(--font-sans)' }}>
          {'\u00A3'}449
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-sans)' }}>
          One-time purchase - No monthly hardware fees
        </div>
        <Button style={{ marginTop: 20 }} size="lg">
          Pre-Order TrustBox Pro
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
                <spec.icon size={16} style={{ color: 'var(--color-electric-blue)' }} />
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
          Features
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 10 }}>
          {FEATURES.map((feat) => (
            <div key={feat} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <CheckCircle size={14} style={{ color: '#00AA78', marginTop: 2, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-sans)', lineHeight: 1.4 }}>
                {feat}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* What's in the box */}
      <Card style={{ padding: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#E8EDF5', marginBottom: 12, fontFamily: 'var(--font-sans)', marginTop: 0 }}>
          In the Box
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {['TrustBox Pro Unit', 'USB-C Power Adapter', 'Ethernet Cable', 'Quick Start Guide', 'HDMI Cable', '1-Year Warranty Card'].map((item) => (
            <Badge key={item} variant="default">{item}</Badge>
          ))}
        </div>
      </Card>
    </div>
  );
}
