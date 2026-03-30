/**
 * Phase 9 - TrustStick Hardware Page
 * Portable AI companion stick at 179 GBP.
 */
import React from 'react';
import { Usb, Cpu, Wifi, Shield, Zap, HardDrive, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

const SPECS = [
  { label: 'Processor', value: 'ARM Cortex-A55 Quad-Core 1.8GHz', icon: Cpu },
  { label: 'Memory', value: '4GB LPDDR4', icon: Zap },
  { label: 'Storage', value: '64GB eMMC', icon: HardDrive },
  { label: 'Connectivity', value: 'Wi-Fi 6, Bluetooth 5.2', icon: Wifi },
  { label: 'Interface', value: 'USB-C (power + data)', icon: Usb },
  { label: 'Security', value: 'Hardware encryption, Secure Element', icon: Shield },
];

const FEATURES = [
  'Plug into any TV or monitor via HDMI',
  'Portable - fits in your pocket',
  'Run up to 3 companions simultaneously',
  'Encrypted local storage for all conversations',
  'Automatic cloud sync when connected',
  'Perfect for elderly users - simple one-plug setup',
  'Low power consumption - 5W maximum',
  'Travel-friendly - works worldwide',
];

export function TrustStickPage() {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
      {/* Hero */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: 40,
          padding: '48px 24px',
          background: 'linear-gradient(135deg, rgba(167,139,250,0.1), rgba(108,142,255,0.05))',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <Usb size={40} style={{ color: '#A78BFA', marginBottom: 12 }} />
        <Badge variant="info">Hardware</Badge>
        <h1 style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-sans)', color: '#E8EDF5', margin: '12px 0 8px' }}>
          TrustStick
        </h1>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', margin: '0 0 20px', fontFamily: 'var(--font-sans)' }}>
          Your companion in your pocket. Plug in anywhere, pick up where you left off.
        </p>
        <div style={{ fontSize: 40, fontWeight: 800, color: '#A78BFA', fontFamily: 'var(--font-sans)' }}>
          {'\u00A3'}179
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-sans)' }}>
          One-time purchase - Includes 3 months Pro subscription
        </div>
        <Button style={{ marginTop: 20 }} size="lg">
          Pre-Order TrustStick
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
                <spec.icon size={16} style={{ color: '#A78BFA' }} />
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
              <CheckCircle size={14} style={{ color: '#A78BFA', marginTop: 2, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-sans)', lineHeight: 1.4 }}>
                {feat}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* In the Box */}
      <Card style={{ padding: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#E8EDF5', marginBottom: 12, fontFamily: 'var(--font-sans)', marginTop: 0 }}>
          In the Box
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {['TrustStick Device', 'USB-C Cable', 'HDMI Adapter', 'Carry Pouch', 'Quick Start Guide', '1-Year Warranty'].map((item) => (
            <Badge key={item} variant="default">{item}</Badge>
          ))}
        </div>
      </Card>
    </div>
  );
}
