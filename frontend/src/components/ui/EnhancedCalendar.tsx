import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline"
import { cn } from "@/lib/utils"
import { useTranslation, useDirectionClasses } from "@/lib/translation"
import { useCalendarLight } from "@/hooks/useCalendarLight"
import "../../styles/calendar-light-effect.css"
import "../../styles/enhanced-calendar.css"

export type CalendarView = "month" | "week" | "day"

export type CalendarProps = {
  mode?: "single" | "multiple" | "range"
  selected?: Date | Date[] | { from: Date; to?: Date }
  onSelect?: (date: Date | Date[] | { from: Date; to?: Date } | undefined) => void
  disabled?: (date: Date) => boolean
  className?: string
  events?: Array<{
    id: number | string
    date: Date
    title: string
    color?: string
    priority?: string
    status?: string
    type?: string
    time?: string
  }>
  onEventClick?: (eventId: number | string) => void
  onDateClick?: (date: Date) => void
  onMonthChange?: (date: Date) => void
  highlightedEventId?: number | null
  view?: CalendarView
  onViewChange?: (view: CalendarView) => void
  showViewSwitcher?: boolean
}

export function EnhancedCalendar({
  mode = "single",
  selected,
  onSelect,
  disabled,
  className,
  events = [],
  onEventClick,
  onDateClick,
  onMonthChange,
  highlightedEventId,
  view = "month",
  onViewChange,
  showViewSwitcher = true,
}: CalendarProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date())
  const [currentView, setCurrentView] = React.useState<CalendarView>(view)
  const { t, currentLanguage } = useTranslation('common');
  const { isRTL } = useDirectionClasses();
  
  // Initialize Windows 10 hover light effect
  useCalendarLight();

  // Month names in Arabic and English
  const monthNames = {
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
  };

  // Day names in Arabic and English
  const dayNames = {
    en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    ar: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
  };

  const getMonthName = () => {
    const month = currentDate.getMonth();
    return currentLanguage === 'ar' ? monthNames.ar[month] : monthNames.en[month];
  };

  const getDayNames = () => {
    return currentLanguage === 'ar' ? dayNames.ar : dayNames.en;
  };

  React.useEffect(() => {
    if (onMonthChange) {
      onMonthChange(currentDate);
    }
  }, [currentDate, onMonthChange]);

  React.useEffect(() => {
    setCurrentView(view);
  }, [view]);

  const handleViewChange = (newView: CalendarView) => {
    setCurrentView(newView);
    onViewChange?.(newView);
  };

  const isSelected = (date: Date) => {
    if (!selected) return false
    if (selected instanceof Date) {
      return isSameDay(date, selected)
    }
    if (Array.isArray(selected)) {
      return selected.some(d => isSameDay(date, d))
    }
    if ('from' in selected) {
      if (!selected.to) return isSameDay(date, selected.from)
      return date >= selected.from && date <= selected.to
    }
    return false
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return isSameDay(date, today)
  }

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    )
  }

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(event.date, date))
  }

  const handleDateClick = (date: Date) => {
    if (disabled && disabled(date)) return
    
    if (onDateClick) {
      onDateClick(date)
    }

    if (mode === "single") {
      onSelect?.(date)
    } else if (mode === "multiple") {
      const selectedDates = Array.isArray(selected) ? selected : []
      const isAlreadySelected = selectedDates.some(d => isSameDay(d, date))
      if (isAlreadySelected) {
        onSelect?.(selectedDates.filter(d => !isSameDay(d, date)))
      } else {
        onSelect?.([...selectedDates, date])
      }
    }
  }

  const navigatePrevious = () => {
    const newDate = new Date(currentDate)
    if (currentView === "month") {
      newDate.setMonth(newDate.getMonth() - 1)
    } else if (currentView === "week") {
      newDate.setDate(newDate.getDate() - 7)
    } else if (currentView === "day") {
      newDate.setDate(newDate.getDate() - 1)
    }
    setCurrentDate(newDate)
  }

  const navigateNext = () => {
    const newDate = new Date(currentDate)
    if (currentView === "month") {
      newDate.setMonth(newDate.getMonth() + 1)
    } else if (currentView === "week") {
      newDate.setDate(newDate.getDate() + 7)
    } else if (currentView === "day") {
      newDate.setDate(newDate.getDate() + 1)
    }
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'missed':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityBorder = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-4 border-red-500'
      case 'high':
        return 'border-l-4 border-orange-500'
      case 'medium':
        return 'border-l-4 border-yellow-500'
      case 'low':
        return 'border-l-4 border-green-500'
      default:
        return ''
    }
  }

  const renderMonthView = () => {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    const startDate = new Date(monthStart)
    startDate.setDate(startDate.getDate() - monthStart.getDay())
    const endDate = new Date(monthEnd)
    endDate.setDate(endDate.getDate() + (6 - monthEnd.getDay()))

    const days = []
    const currentDateIter = new Date(startDate)
    while (currentDateIter <= endDate) {
      days.push(new Date(currentDateIter))
      currentDateIter.setDate(currentDateIter.getDate() + 1)
    }

    const weeks: Date[][] = []
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7))
    }

    return (
      <div className="calendar-container bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          {getDayNames().map((day) => (
            <div
              key={day}
              className="py-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 border-b border-gray-100 last:border-b-0">
            {week.map((date, dayIndex) => {
              const dayEvents = getEventsForDate(date)
              const isDisabled = disabled && disabled(date)
              const selected = isSelected(date)
              const today = isToday(date)
              const isCurrentMonth = date.getMonth() === currentDate.getMonth()

              return (
                <div
                  key={dayIndex}
                  className={cn(
                    "calendar-day min-h-[120px] p-3 border-r border-gray-100 last:border-r-0 hover:bg-gray-50 transition-colors cursor-pointer",
                    !isCurrentMonth && "bg-gray-50/50 text-gray-400",
                    isDisabled && "opacity-50 cursor-not-allowed",
                    today && "bg-blue-50",
                    selected && "bg-blue-100"
                  )}
                  onClick={() => !isDisabled && handleDateClick(date)}
                >
                  {/* Date Number */}
                  <div className="flex items-center justify-center mb-2">
                    <span
                      className={cn(
                        "w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-all",
                        today && "bg-blue-600 text-white shadow-md",
                        selected && !today && "bg-blue-500 text-white",
                        !today && !selected && isCurrentMonth && "text-gray-900 hover:bg-gray-200",
                        !today && !selected && !isCurrentMonth && "text-gray-400"
                      )}
                    >
                      {date.getDate()}
                    </span>
                  </div>

                  {/* Events */}
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((event) => {
                      const isRecurring = typeof event.id === 'string' && event.id.startsWith('contract_');
                      const isHighlighted = highlightedEventId === event.id;
                      return (
                        <div
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            onEventClick?.(event.id)
                          }}
                          className={cn(
                            "event-card cursor-pointer transition-all",
                            `status-${event.status}`,
                            `priority-${event.priority}`,
                            isHighlighted && "event-highlighted",
                            isRecurring && "border-dashed"
                          )}
                          title={`${event.title}${isRecurring ? ' (Recurring)' : ''}`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0 opacity-60" />
                            <span className="truncate font-medium">{event.title}</span>
                            {event.time && <span className="text-[10px] opacity-75">{event.time}</span>}
                            {isRecurring && <span className="text-[10px] ml-auto opacity-60">↻</span>}
                          </div>
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-500 px-2 font-medium">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    )
  }

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
    
    const weekDays = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      weekDays.push(day)
    }

    return (
      <div className="calendar-container bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {/* Time slots header */}
        <div className="grid grid-cols-8 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="py-4 px-4 text-sm font-semibold text-gray-700">Time</div>
          {weekDays.map((day, index) => {
            const today = isToday(day)
            return (
              <div
                key={index}
                className={cn(
                  "py-4 px-2 text-center border-l border-gray-200",
                  today && "bg-blue-50"
                )}
              >
                <div className="text-xs font-medium text-gray-500 uppercase">
                  {getDayNames()[day.getDay()]}
                </div>
                <div className={cn(
                  "text-lg font-semibold mt-1",
                  today ? "text-blue-600" : "text-gray-900"
                )}>
                  {day.getDate()}
                </div>
              </div>
            )
          })}
        </div>

        {/* Time slots */}
        <div className="max-h-96 overflow-y-auto">
          {Array.from({ length: 12 }, (_, hour) => hour + 8).map((hour) => (
            <div key={hour} className="grid grid-cols-8 border-b border-gray-100 min-h-[60px]">
              <div className="py-3 px-4 text-sm text-gray-500 border-r border-gray-200 bg-gray-50/50">
                {hour.toString().padStart(2, '0')}:00
              </div>
              {weekDays.map((day, dayIndex) => {
                const dayEvents = getEventsForDate(day).filter(event => {
                  if (!event.time) return hour === 9 // Default to 9 AM if no time
                  const eventHour = parseInt(event.time.split(':')[0])
                  return eventHour === hour
                })
                
                return (
                  <div
                    key={dayIndex}
                    className="py-2 px-2 border-l border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleDateClick(day)}
                  >
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          onEventClick?.(event.id)
                        }}
                        className={cn(
                          "text-xs px-2 py-1 rounded-md cursor-pointer transition-all hover:shadow-sm border mb-1",
                          getPriorityBorder(event.priority),
                          getStatusColor(event.status)
                        )}
                      >
                        <div className="font-medium truncate">{event.title}</div>
                        {event.time && <div className="text-[10px] opacity-75">{event.time}</div>}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate)
    const today = isToday(currentDate)

    return (
      <div className="calendar-container bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {/* Day header */}
        <div className={cn(
          "py-6 px-6 border-b border-gray-200 text-center",
          today ? "bg-blue-50" : "bg-gradient-to-r from-gray-50 to-gray-100"
        )}>
          <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            {getDayNames()[currentDate.getDay()]}
          </div>
          <div className={cn(
            "text-3xl font-bold mt-2",
            today ? "text-blue-600" : "text-gray-900"
          )}>
            {currentDate.getDate()}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {getMonthName()} {currentDate.getFullYear()}
          </div>
        </div>

        {/* Time slots */}
        <div className="max-h-96 overflow-y-auto">
          {Array.from({ length: 12 }, (_, hour) => hour + 8).map((hour) => {
            const hourEvents = dayEvents.filter(event => {
              if (!event.time) return hour === 9 // Default to 9 AM if no time
              const eventHour = parseInt(event.time.split(':')[0])
              return eventHour === hour
            })

            return (
              <div key={hour} className="flex border-b border-gray-100 min-h-[80px]">
                <div className="w-20 py-4 px-4 text-sm text-gray-500 border-r border-gray-200 bg-gray-50/50 flex-shrink-0">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                <div className="flex-1 py-3 px-4 space-y-2">
                  {hourEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => onEventClick?.(event.id)}
                      className={cn(
                        "p-3 rounded-lg cursor-pointer transition-all hover:shadow-md border",
                        getPriorityBorder(event.priority),
                        getStatusColor(event.status)
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{event.title}</div>
                        {event.time && <div className="text-sm opacity-75">{event.time}</div>}
                      </div>
                    </div>
                  ))}
                  {hourEvents.length === 0 && (
                    <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                      No events
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const getViewTitle = () => {
    if (currentView === "day") {
      return `${getDayNames()[currentDate.getDay()]}, ${getMonthName()} ${currentDate.getDate()}, ${currentDate.getFullYear()}`
    } else if (currentView === "week") {
      const startOfWeek = new Date(currentDate)
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      
      if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
        return `${getMonthName()} ${startOfWeek.getDate()}-${endOfWeek.getDate()}, ${currentDate.getFullYear()}`
      } else {
        return `${monthNames[currentLanguage][startOfWeek.getMonth()]} ${startOfWeek.getDate()} - ${monthNames[currentLanguage][endOfWeek.getMonth()]} ${endOfWeek.getDate()}, ${currentDate.getFullYear()}`
      }
    } else {
      return `${getMonthName()} ${currentDate.getFullYear()}`
    }
  }

  return (
    <div className={cn("w-full enhanced-calendar", className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {getViewTitle()}
          </h2>
          <button
            onClick={goToToday}
            className="today-button"
          >
            {t('today', { fallback: 'Today' })}
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          {/* View Switcher */}
          {showViewSwitcher && (
            <div className="view-switcher">
              {(['month', 'week', 'day'] as CalendarView[]).map((viewOption) => (
                <button
                  key={viewOption}
                  onClick={() => handleViewChange(viewOption)}
                  className={cn(
                    "transition-all",
                    currentView === viewOption && "active"
                  )}
                >
                  {t(viewOption, { fallback: viewOption.charAt(0).toUpperCase() + viewOption.slice(1) })}
                </button>
              ))}
            </div>
          )}
          
          {/* Navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={navigatePrevious}
              className="nav-button"
            >
              {isRTL ? <ChevronRightIcon className="w-5 h-5" /> : <ChevronLeftIcon className="w-5 h-5" />}
            </button>
            <button
              onClick={navigateNext}
              className="nav-button"
            >
              {isRTL ? <ChevronLeftIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      {currentView === "month" && renderMonthView()}
      {currentView === "week" && renderWeekView()}
      {currentView === "day" && renderDayView()}

      {/* Legend */}
      <div className="legend">
        <div className="flex flex-wrap gap-6 text-xs text-gray-600">
          <div className="flex items-center gap-3">
            <span className="font-semibold">Status:</span>
            <div className="flex items-center gap-4">
              <div className="legend-item">
                <span className="legend-dot bg-green-500" />
                <span>Completed</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot bg-blue-500" />
                <span>In Progress</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot bg-yellow-500" />
                <span>Scheduled</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot bg-red-500" />
                <span>Cancelled</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-semibold">Priority:</span>
            <div className="flex items-center gap-4">
              <div className="legend-item">
                <span className="legend-bar bg-red-500" />
                <span>Urgent</span>
              </div>
              <div className="legend-item">
                <span className="legend-bar bg-orange-500" />
                <span>High</span>
              </div>
              <div className="legend-item">
                <span className="legend-bar bg-yellow-500" />
                <span>Medium</span>
              </div>
              <div className="legend-item">
                <span className="legend-bar bg-green-500" />
                <span>Low</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}