import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline"
import { cn } from "@/lib/utils"
import { useTranslation, useDirectionClasses } from "@/lib/translation"

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
  }>
  onEventClick?: (eventId: number | string) => void
  onDateClick?: (date: Date) => void
  onMonthChange?: (date: Date) => void
  highlightedEventId?: number | null
}

export function Calendar({
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
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date())
  const { t, currentLanguage } = useTranslation('common');
  const { isRTL } = useDirectionClasses();

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
    const month = currentMonth.getMonth();
    return currentLanguage === 'ar' ? monthNames.ar[month] : monthNames.en[month];
  };

  const getDayNames = () => {
    return currentLanguage === 'ar' ? dayNames.ar : dayNames.en;
  };

  React.useEffect(() => {
    if (onMonthChange) {
      onMonthChange(currentMonth);
    }
  }, [currentMonth, onMonthChange]);

  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
  const startDate = new Date(monthStart)
  startDate.setDate(startDate.getDate() - startDate.getDay())
  const endDate = new Date(monthEnd)
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()))

  const days = []
  const currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    days.push(new Date(currentDate))
    currentDate.setDate(currentDate.getDate() + 1)
  }

  const weeks: Date[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

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

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth()
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

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const goToToday = () => {
    setCurrentMonth(new Date())
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500'
      case 'in_progress':
        return 'bg-blue-500'
      case 'scheduled':
        return 'bg-yellow-500'
      case 'cancelled':
        return 'bg-red-500'
      case 'missed':
        return 'bg-orange-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getPriorityBorder = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-4 border-red-600'
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

  return (
    <div className={cn("w-full", className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-2">
        <h2 className="text-lg font-semibold text-gray-900">
          {getMonthName()} {currentMonth.getFullYear()}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {t('today', { fallback: 'Today' })}
          </button>
          <button
            onClick={previousMonth}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isRTL ? <ChevronRightIcon className="w-5 h-5" /> : <ChevronLeftIcon className="w-5 h-5" />}
          </button>
          <button
            onClick={nextMonth}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isRTL ? <ChevronLeftIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
          {getDayNames().map((day) => (
            <div
              key={day}
              className="py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 border-b border-gray-200 last:border-b-0">
            {week.map((date, dayIndex) => {
              const dayEvents = getEventsForDate(date)
              const isDisabled = disabled && disabled(date)
              const selected = isSelected(date)
              const today = isToday(date)
              const currentMonthDay = isCurrentMonth(date)

              return (
                <div
                  key={dayIndex}
                  className={cn(
                    "min-h-[120px] border-r border-gray-200 last:border-r-0 p-2 transition-colors",
                    !currentMonthDay && "bg-gray-50",
                    isDisabled && "opacity-50 cursor-not-allowed",
                    !isDisabled && "hover:bg-gray-50 cursor-pointer"
                  )}
                  onClick={() => !isDisabled && handleDateClick(date)}
                >
                  {/* Date Number */}
                  <div className="flex items-center justify-center mb-1">
                    <span
                      className={cn(
                        "w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium transition-colors",
                        today && "bg-primary-600 text-white",
                        selected && !today && "bg-primary-100 text-primary-700",
                        !today && !selected && currentMonthDay && "text-gray-900",
                        !today && !selected && !currentMonthDay && "text-gray-400"
                      )}
                    >
                      {date.getDate()}
                    </span>
                  </div>

                  {/* Events */}
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((event) => {
                      const isRecurring = typeof event.id === 'string' && event.id.startsWith('contract_');
                      return (
                        <div
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            onEventClick?.(event.id)
                          }}
                          className={cn(
                            "text-xs px-2 py-1 rounded cursor-pointer transition-all hover:shadow-md",
                            getPriorityBorder(event.priority),
                            event.color || "bg-primary-100 text-primary-700",
                            highlightedEventId === event.id && "ring-2 ring-yellow-400 shadow-lg scale-105 animate-pulse",
                            isRecurring && "opacity-70 border-dashed border"
                          )}
                          title={`${event.title}${isRecurring ? ' (Recurring)' : ''}`}
                        >
                          <div className="flex items-center gap-1">
                            <span className={cn("w-2 h-2 rounded-full flex-shrink-0", getStatusColor(event.status))} />
                            <span className="truncate font-medium">{event.title}</span>
                            {isRecurring && <span className="text-[10px] ml-auto">↻</span>}
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

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <span className="font-semibold">Status:</span>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-green-500" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>Scheduled</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span>Cancelled</span>
          </div>
        </div>
      </div>
    </div>
  )
}
