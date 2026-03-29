/**
 * SessionScheduler - Weekly schedule grid and calendar sync UI
 *
 * Features:
 * - Weekly grid (Mon-Sun) with clickable time slots
 * - Suggested schedule based on past behaviour
 * - Calendar sync: .ics download, Google Calendar link
 * - Next session indicator
 * - Missed session notifications
 */
import React from 'react';
import {
  Calendar,
  Clock,
  Download,
  ExternalLink,
  Lightbulb,
  Bell,
  BellOff,
  Check,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useScheduleStore } from '@/store/scheduleStore';
import api from '@/lib/api';
import {
  type DayOfWeek,
  DAYS_OF_WEEK,
  DAY_SHORT_LABELS,
  formatTime,
  downloadICSFile,
  generateGoogleCalendarURL,
} from '@/lib/session-scheduler';

interface SessionSchedulerProps {
  roleId: string;
  roleName: string;
  accentColor?: string;
  onClose?: () => void;
}

/** Time slots shown in the grid (6 AM to 10 PM in 1-hour increments) */
const GRID_HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6..22

export function SessionScheduler({
  roleId,
  roleName,
  accentColor,
  onClose,
}: SessionSchedulerProps) {
  const {
    notifications,
    calendarSynced,
    defaultDuration,
    hasSlot,
    toggleSlot,
    getSlotsForRole,
    getNextSession,
    getSuggestedSchedule,
    getMissedSessions,
    setNotifications,
    setCalendarSynced,
  } = useScheduleStore();

  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [showCalendarSync, setShowCalendarSync] = React.useState(false);

  const accent = accentColor || 'var(--color-electric-blue)';
  const roleSlots = getSlotsForRole(roleId);
  const nextSession = getNextSession();
  const missedSessions = getMissedSessions();
  const suggestions = getSuggestedSchedule();

  // B.9: Toggle slot - create/delete schedule in DB via tRPC
  const handleToggleSlot = async (day: DayOfWeek, hour: number) => {
    const isActive = hasSlot(day, hour, 0);

    if (!isActive) {
      // Create schedule via tRPC
      try {
        const result = await api.post<{ scheduleId: string; nextSessionAt: string; icsUrl: string }>(
          '/trpc/scheduling.createSchedule',
          { json: { hireId: roleId, dayOfWeek: day, time: `${String(hour).padStart(2, '0')}:00`, durationMins: defaultDuration } }
        );
        console.log('Schedule created:', result.scheduleId);
      } catch (err) {
        console.error('Failed to create schedule via tRPC:', err);
      }
    }

    // Update local store (handles both add and remove in UI)
    toggleSlot(day, hour, 0, roleId, roleName, defaultDuration);
  };

  // B.9: Download ICS via tRPC
  const handleDownloadICS = async () => {
    if (roleSlots.length === 0) return;

    // Try to get ICS from server first
    try {
      const schedules = await api.get<{ result: { data: Array<{ id: string; icsUrl: string }> } }>(
        `/trpc/scheduling.getMySchedules?input=${encodeURIComponent(JSON.stringify({ hireId: roleId }))}`
      );
      const serverSchedules = schedules?.result?.data || [];
      if (serverSchedules.length > 0 && serverSchedules[0].icsUrl) {
        // Download from server ICS endpoint
        const icsResponse = await fetch(serverSchedules[0].icsUrl);
        if (icsResponse.ok) {
          const blob = await icsResponse.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `trust-agent-${roleName.toLowerCase().replace(/\s+/g, '-')}.ics`;
          a.click();
          URL.revokeObjectURL(url);
          setCalendarSynced(true);
          return;
        }
      }
    } catch {
      // Fall through to local generation
    }

    // Fall back to local ICS generation
    downloadICSFile(roleSlots, `trust-agent-${roleName.toLowerCase().replace(/\s+/g, '-')}.ics`);
    setCalendarSynced(true);
  };

  const handleGoogleCalendar = (slotIndex: number) => {
    const slot = roleSlots[slotIndex];
    if (!slot) return;
    const url = generateGoogleCalendarURL(slot);
    window.open(url, '_blank');
    setCalendarSynced(true);
  };

  const handleApplySuggestion = (day: DayOfWeek, hour: number) => {
    if (!hasSlot(day, hour, 0)) {
      toggleSlot(day, hour, 0, roleId, roleName, defaultDuration);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: `${accent}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Calendar size={18} color={accent} />
          </div>
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#E8EDF5',
                fontFamily: 'var(--font-sans)',
              }}
            >
              Session Schedule
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--color-text-muted)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {roleName} - {roleSlots.length} session{roleSlots.length !== 1 ? 's' : ''}/week
            </div>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            Done
          </Button>
        )}
      </div>

      {/* Missed session warning */}
      {missedSessions.length > 0 && (
        <Card padding="12px" style={{ borderColor: 'rgba(245,158,11,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={16} color="#F59E0B" />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#F59E0B',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Missed Session
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--color-text-muted)',
                  fontFamily: 'var(--font-sans)',
                  marginTop: 2,
                }}
              >
                You missed your session with {missedSessions[0].roleName} yesterday. Want to reschedule?
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Next session indicator */}
      {nextSession && (
        <Card padding="12px">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Clock size={14} color={accent} />
            <div
              style={{
                fontSize: 12,
                color: '#E8EDF5',
                fontFamily: 'var(--font-sans)',
              }}
            >
              Next session:{' '}
              <span style={{ fontWeight: 600, color: accent }}>
                {nextSession.date.toLocaleDateString('en-US', { weekday: 'short' })}{' '}
                {formatTime(nextSession.slot.hour, nextSession.slot.minute)}
              </span>{' '}
              with {nextSession.slot.roleName}
            </div>
          </div>
        </Card>
      )}

      {/* Weekly grid */}
      <Card padding="12px">
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginBottom: 10,
            fontFamily: 'var(--font-sans)',
          }}
        >
          Weekly Schedule
        </div>

        {/* Grid */}
        <div style={{ overflowX: 'auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '48px repeat(7, 1fr)',
              gap: 1,
              minWidth: 500,
            }}
          >
            {/* Header row */}
            <div />
            {DAYS_OF_WEEK.map((day) => (
              <div
                key={day}
                style={{
                  textAlign: 'center',
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'var(--color-text-muted)',
                  padding: '4px 0',
                  fontFamily: 'var(--font-sans)',
                  textTransform: 'uppercase',
                }}
              >
                {DAY_SHORT_LABELS[day]}
              </div>
            ))}

            {/* Time rows */}
            {GRID_HOURS.map((hour) => (
              <React.Fragment key={hour}>
                {/* Time label */}
                <div
                  style={{
                    fontSize: 9,
                    color: 'var(--color-text-muted)',
                    fontFamily: 'var(--font-mono)',
                    textAlign: 'right',
                    paddingRight: 6,
                    paddingTop: 2,
                    lineHeight: '24px',
                  }}
                >
                  {formatTime(hour, 0)}
                </div>

                {/* Cells */}
                {DAYS_OF_WEEK.map((day) => {
                  const isActive = hasSlot(day, hour, 0);
                  return (
                    <button
                      key={`${day}-${hour}`}
                      onClick={() => handleToggleSlot(day, hour)}
                      style={{
                        width: '100%',
                        height: 24,
                        border: '1px solid var(--color-border)',
                        borderRadius: 3,
                        background: isActive ? `${accent}30` : 'rgba(255,255,255,0.02)',
                        cursor: 'pointer',
                        transition: 'all 100ms ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.02)';
                        }
                      }}
                      title={`${DAY_SHORT_LABELS[day]} ${formatTime(hour, 0)}`}
                    >
                      {isActive && (
                        <div
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: accent,
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div
          style={{
            marginTop: 10,
            fontSize: 10,
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-sans)',
            textAlign: 'center',
          }}
        >
          Click cells to add or remove session times
        </div>
      </Card>

      {/* Suggested schedule */}
      <Card padding="12px">
        <button
          onClick={() => setShowSuggestions(!showSuggestions)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Lightbulb size={14} color="#F59E0B" />
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#E8EDF5',
                fontFamily: 'var(--font-sans)',
              }}
            >
              Suggested Schedule
            </span>
          </div>
          <ChevronRight
            size={14}
            color="var(--color-text-muted)"
            style={{
              transform: showSuggestions ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 150ms ease',
            }}
          />
        </button>

        {showSuggestions && (
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {suggestions.map((suggestion, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  background: 'var(--color-surface-2)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#E8EDF5',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    {DAY_SHORT_LABELS[suggestion.day]} at {formatTime(suggestion.hour, suggestion.minute)}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: 'var(--color-text-muted)',
                      fontFamily: 'var(--font-sans)',
                      marginTop: 2,
                    }}
                  >
                    {suggestion.reason}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleApplySuggestion(suggestion.day, suggestion.hour)}
                  icon={
                    hasSlot(suggestion.day, suggestion.hour, 0) ? (
                      <Check size={12} />
                    ) : undefined
                  }
                  disabled={hasSlot(suggestion.day, suggestion.hour, 0)}
                >
                  {hasSlot(suggestion.day, suggestion.hour, 0) ? 'Added' : 'Add'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Calendar sync */}
      <Card padding="12px">
        <button
          onClick={() => setShowCalendarSync(!showCalendarSync)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={14} color={accent} />
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#E8EDF5',
                fontFamily: 'var(--font-sans)',
              }}
            >
              Sync to Calendar
            </span>
            {calendarSynced && (
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  color: 'var(--color-success)',
                  fontFamily: 'var(--font-sans)',
                  background: 'rgba(34,197,94,0.1)',
                  padding: '2px 6px',
                  borderRadius: 4,
                }}
              >
                Synced
              </span>
            )}
          </div>
          <ChevronRight
            size={14}
            color="var(--color-text-muted)"
            style={{
              transform: showCalendarSync ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 150ms ease',
            }}
          />
        </button>

        {showCalendarSync && (
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {roleSlots.length === 0 ? (
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--color-text-muted)',
                  fontFamily: 'var(--font-sans)',
                  textAlign: 'center',
                  padding: '8px 0',
                }}
              >
                Add sessions to your schedule first to enable calendar sync.
              </div>
            ) : (
              <>
                {/* Download .ics (Apple Calendar / generic) */}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDownloadICS}
                  icon={<Download size={13} />}
                  style={{ justifyContent: 'flex-start' }}
                >
                  Download .ics (Apple Calendar / Outlook)
                </Button>

                {/* Google Calendar links per slot */}
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    marginTop: 4,
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  Google Calendar
                </div>
                {roleSlots.map((slot, i) => (
                  <button
                    key={slot.id}
                    onClick={() => handleGoogleCalendar(i)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 10px',
                      background: 'var(--color-surface-2)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border-active)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)';
                    }}
                  >
                    <ExternalLink size={12} color="var(--color-text-muted)" />
                    <span
                      style={{
                        fontSize: 11,
                        color: '#E8EDF5',
                        fontFamily: 'var(--font-sans)',
                      }}
                    >
                      {DAY_SHORT_LABELS[slot.day]} {formatTime(slot.hour, slot.minute)} -
                      Add to Google Calendar
                    </span>
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </Card>

      {/* Notification toggle */}
      <Card padding="12px">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {notifications ? (
              <Bell size={14} color={accent} />
            ) : (
              <BellOff size={14} color="var(--color-text-muted)" />
            )}
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#E8EDF5',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Session Reminders
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: 'var(--color-text-muted)',
                  fontFamily: 'var(--font-sans)',
                  marginTop: 2,
                }}
              >
                Get notified 15 minutes before sessions
              </div>
            </div>
          </div>
          <button
            onClick={() => setNotifications(!notifications)}
            style={{
              width: 40,
              height: 22,
              borderRadius: 11,
              background: notifications ? accent : 'var(--color-surface-2)',
              border: `1px solid ${notifications ? accent : 'var(--color-border)'}`,
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 200ms ease',
              padding: 0,
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: '#fff',
                position: 'absolute',
                top: 2,
                left: notifications ? 20 : 2,
                transition: 'left 200ms ease',
              }}
            />
          </button>
        </div>
      </Card>
    </div>
  );
}

export default SessionScheduler;
