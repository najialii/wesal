import { useEffect, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FormModal } from '@/components/ui/form-modal'
import { Form } from '@/components/ui/form'
import { 
  CalendarIcon, 
  MagnifyingGlassIcon, 
  XMarkIcon,
  ClockIcon,
  UserIcon,
  PhoneIcon,
  MapPinIcon,
  WrenchScrewdriverIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'sonner'
import api from '@/lib/api'
import moment from 'moment'

const maintenanceScheduleSchema = z.object({
  maintenance_contract_id: z.union([
    z.number().min(1, 'Please select a maintenance contract'),
    z.string().min(1, 'Please select a maintenance contract').transform(val => parseInt(val))
  ]),
  priority: z.enum(['low', 'medium', 'high', 'urgent'], {
    required_error: 'Priority is required',
  }),
})

type MaintenanceScheduleFormData = z.infer<typeof maintenanceScheduleSchema>

interface MaintenanceContract {
  id: number
  customer_name: string
  customer_phone?: string
  customer_address?: string
  product: {
    id: number
    name: string
  }
  assigned_technician_id?: number
  assigned_technician?: {
    id: number
    name: string
  }
  frequency: string
  start_date: string
  status: string
  next_visit_date?: string
  branch?: {
    id: number
    name: string
    code: string
  }
}

interface DayScheduleInfo {
  date: string
  technician_name: string
  visits_count: number
  suggested_time: string
}

interface Worker {
  id: number
  name: string
  job_title: string
  phone?: string
}

interface MaintenanceScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function MaintenanceScheduleModal({
  isOpen,
  onClose,
  onSuccess,
}: MaintenanceScheduleModalProps) {
  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  const [contracts, setContracts] = useState<MaintenanceContract[]>([])
  const [filteredContracts, setFilteredContracts] = useState<MaintenanceContract[]>([])
  const [selectedContract, setSelectedContract] = useState<MaintenanceContract | null>(null)
  const [scheduleInfo, setScheduleInfo] = useState<DayScheduleInfo | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [showTimeSlots, setShowTimeSlots] = useState(false)
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null)
  const [showWorkerDropdown, setShowWorkerDropdown] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const form = useForm<MaintenanceScheduleFormData>({
    resolver: zodResolver(maintenanceScheduleSchema),
    defaultValues: {
      maintenance_contract_id: 0,
      priority: 'medium',
    },
  })

  const watchedContractId = form.watch('maintenance_contract_id')

  useEffect(() => {
    if (isOpen) {
      fetchInitialData()
    } else {
      // Reset search when modal closes
      setSearchQuery('')
      setShowDropdown(false)
    }
  }, [isOpen])

  // Remove the old watchedContractId effect since we're handling selection manually now

  // Filter contracts based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredContracts(contracts)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = contracts.filter(contract => 
        contract.customer_name.toLowerCase().includes(query) ||
        contract.product.name.toLowerCase().includes(query) ||
        contract.frequency.toLowerCase().includes(query) ||
        (contract.customer_phone && contract.customer_phone.includes(query))
      )
      setFilteredContracts(filtered)
    }
  }, [searchQuery, contracts])

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (watchedContractId) {
      // Convert string to number if needed
      const contractId = typeof watchedContractId === 'string' ? parseInt(watchedContractId) : watchedContractId
      const contract = contracts.find(c => c.id === contractId)
      
      console.log('Selected contract ID:', contractId, 'Found contract:', contract)
      
      setSelectedContract(contract || null)
      
      if (contract) {
        calculateScheduleInfo(contract)
      } else {
        setScheduleInfo(null)
      }
    } else {
      setSelectedContract(null)
      setScheduleInfo(null)
    }
  }, [watchedContractId, contracts])

  const calculateScheduleInfo = async (contract: MaintenanceContract) => {
    try {
      console.log('Calculating schedule for contract:', contract)
      
      // Calculate next visit date based on frequency
      const nextDate = calculateNextVisitDate(contract)
      console.log('Next visit date:', nextDate)
      
      // Fetch technician's schedule for that day
      if (contract.assigned_technician_id && nextDate) {
        try {
          const response = await api.get('/maintenance/visits', {
            params: {
              date: nextDate,
              worker_id: contract.assigned_technician_id
            }
          })
          
          const visitsData = response.data.visits?.data || response.data.data || []
          const visitsCount = Array.isArray(visitsData) ? visitsData.length : 0
          
          console.log('Existing visits for technician:', visitsCount)
          
          // Suggest time based on existing visits
          const suggestedTime = suggestOptimalTime(visitsCount)
          
          setScheduleInfo({
            date: nextDate,
            technician_name: contract.assigned_technician?.name || 'Assigned Technician',
            visits_count: visitsCount,
            suggested_time: suggestedTime
          })
        } catch (error) {
          console.error('Failed to fetch technician schedule:', error)
          // Still set schedule info with default values
          setScheduleInfo({
            date: nextDate,
            technician_name: contract.assigned_technician?.name || 'Assigned Technician',
            visits_count: 0,
            suggested_time: '09:00'
          })
        }
      } else {
        // No technician assigned, use defaults
        setScheduleInfo({
          date: nextDate,
          technician_name: 'No Technician Assigned',
          visits_count: 0,
          suggested_time: '09:00'
        })
      }
    } catch (error) {
      console.error('Failed to calculate schedule:', error)
      toast.error('Failed to calculate schedule information')
    }
  }

  const calculateNextVisitDate = (contract: MaintenanceContract): string => {
    // If contract has next_visit_date, use it
    if (contract.next_visit_date) {
      return moment(contract.next_visit_date).format('YYYY-MM-DD')
    }

    // Otherwise calculate based on frequency from start_date
    // Use local timezone to avoid date shifting issues
    const startDate = moment(contract.start_date).startOf('day')
    const today = moment().startOf('day')
    
    let nextDate = moment(startDate)
    
    switch (contract.frequency) {
      case 'weekly':
        while (nextDate.isBefore(today)) {
          nextDate.add(1, 'week')
        }
        break
      case 'monthly':
        while (nextDate.isBefore(today)) {
          nextDate.add(1, 'month')
        }
        break
      case 'quarterly':
        while (nextDate.isBefore(today)) {
          nextDate.add(3, 'months')
        }
        break
      case 'semi_annual':
        while (nextDate.isBefore(today)) {
          nextDate.add(6, 'months')
        }
        break
      case 'annual':
        while (nextDate.isBefore(today)) {
          nextDate.add(1, 'year')
        }
        break
      case 'once':
      default:
        nextDate = moment(today).add(1, 'day')
        break
    }
    
    return nextDate.format('YYYY-MM-DD')
  }

  const suggestOptimalTime = (existingVisits: number): string => {
    // Best practice: Start at 9 AM, schedule 1.5 hours per visit
    const startHour = 9
    const hoursPerVisit = 1.5
    
    const suggestedHour = startHour + (existingVisits * hoursPerVisit)
    const hour = Math.floor(suggestedHour)
    const minutes = (suggestedHour % 1) * 60
    
    // Don't schedule after 5 PM
    if (hour >= 17) {
      return '09:00' // Next day, start fresh
    }
    
    return `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  const generateTimeSlots = (): string[] => {
    const slots: string[] = []
    const startHour = 8 // 8 AM
    const endHour = 18 // 6 PM
    const intervalMinutes = 30

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += intervalMinutes) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        slots.push(timeString)
      }
    }
    
    return slots
  }

  const handleTimeSlotClick = () => {
    const slots = generateTimeSlots()
    setAvailableTimeSlots(slots)
    setShowTimeSlots(true)
  }

  const handleTimeSelect = (time: string) => {
    if (scheduleInfo) {
      setScheduleInfo({
        ...scheduleInfo,
        suggested_time: time
      })
    }
    setShowTimeSlots(false)
  }

  const handleDateChange = (date: string) => {
    // Ensure the date is in YYYY-MM-DD format and handle it consistently
    const formattedDate = moment(date).format('YYYY-MM-DD')
    setSelectedDate(formattedDate)
    if (scheduleInfo) {
      setScheduleInfo({
        ...scheduleInfo,
        date: formattedDate
      })
    }
    setShowDatePicker(false)
  }

  const handleWorkerSelect = (worker: Worker) => {
    setSelectedWorker(worker)
    if (scheduleInfo) {
      setScheduleInfo({
        ...scheduleInfo,
        technician_name: worker.name
      })
    }
    setShowWorkerDropdown(false)
  }

  const fetchInitialData = async () => {
    try {
      setFetchingData(true)
      
      // Fetch contracts
      const contractsResponse = await api.get('/maintenance/contracts', {
        params: { status: 'active', per_page: 100 }
      })

      // Handle different response structures
      let contractsData = []
      if (contractsResponse.data.data?.data) {
        contractsData = contractsResponse.data.data.data
      } else if (contractsResponse.data.data) {
        contractsData = Array.isArray(contractsResponse.data.data) ? contractsResponse.data.data : [contractsResponse.data.data]
      } else if (contractsResponse.data.contracts) {
        contractsData = contractsResponse.data.contracts
      }
      
      console.log('Fetched contracts:', contractsData)
      setContracts(Array.isArray(contractsData) ? contractsData : [])
      
      // Fetch workers/technicians
      try {
        const workersResponse = await api.get('/maintenance/workers')
        const workersData = workersResponse.data.workers || []
        setWorkers(workersData)
        console.log('Fetched workers:', workersData)
      } catch (error) {
        console.error('Failed to fetch workers:', error)
        // Don't show error toast, workers are optional
      }
      
      if (contractsData.length === 0) {
        toast.info('No active maintenance contracts found. Please create a contract first.')
      }
    } catch (error: any) {
      console.error('Failed to fetch contracts:', error)
      toast.error(error.response?.data?.message || 'Failed to load contracts')
    } finally {
      setFetchingData(false)
    }
  }

  const handleSubmit = async (data: MaintenanceScheduleFormData) => {
    if (!scheduleInfo) {
      toast.error('Schedule information not available. Please select a contract.')
      return
    }

    if (!selectedContract) {
      toast.error('Please select a maintenance contract')
      return
    }

    try {
      setLoading(true)
      
      // Ensure contract ID is a number
      const contractId = typeof data.maintenance_contract_id === 'string' 
        ? parseInt(data.maintenance_contract_id) 
        : data.maintenance_contract_id
      
      // Get current branch ID - try to get from contract first, then from session/user
      let branchId = selectedContract?.branch?.id || null;
      
      // If no branch in contract, try to get current branch from API
      if (!branchId) {
        try {
          const branchResponse = await api.get('/business/branches/current');
          branchId = branchResponse.data?.branch?.id || branchResponse.data?.id || null;
        } catch (branchError) {
          console.warn('Could not get current branch:', branchError);
          // For single-branch businesses, we might need to get the default branch
          try {
            const branchesResponse = await api.get('/business/branches');
            const branches = branchesResponse.data?.data || branchesResponse.data || [];
            if (branches.length > 0) {
              branchId = branches[0].id;
            }
          } catch (branchesError) {
            console.warn('Could not get branches:', branchesError);
          }
        }
      }
      
      const payload = {
        maintenance_contract_id: contractId,
        scheduled_date: moment(scheduleInfo.date).format('YYYY-MM-DD'), // Ensure consistent date format
        scheduled_time: scheduleInfo.suggested_time,
        assigned_technician_id: selectedWorker?.id || selectedContract?.assigned_technician_id || null,
        priority: data.priority,
        work_description: `Scheduled ${selectedContract?.frequency} maintenance for ${selectedContract?.product.name}`,
        branch_id: branchId, // Add branch_id to the payload
      }
      
      console.log('Submitting visit:', payload)
      
      const response = await api.post('/maintenance/visits', payload)
      
      console.log('Visit created:', response.data)

      toast.success('Maintenance visit scheduled successfully')
      onSuccess()
      handleClose()
    } catch (error: any) {
      console.error('Failed to schedule maintenance visit:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to schedule maintenance visit'
      toast.error(errorMessage)
      
      // Show validation errors if present
      if (error.response?.data?.errors) {
        Object.values(error.response.data.errors).forEach((err: any) => {
          if (Array.isArray(err)) {
            err.forEach(msg => toast.error(msg))
          }
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleContractSelect = (contract: MaintenanceContract) => {
    setSelectedContract(contract)
    setSearchQuery(`${contract.customer_name} - ${contract.product.name}`)
    setShowDropdown(false)
    form.setValue('maintenance_contract_id', contract.id)
    calculateScheduleInfo(contract)
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setSelectedContract(null)
    setScheduleInfo(null)
    form.setValue('maintenance_contract_id', 0)
    setShowDropdown(false)
  }

  const handleClose = () => {
    form.reset()
    setSelectedContract(null)
    setScheduleInfo(null)
    setSearchQuery('')
    setShowDropdown(false)
    onClose()
  }

  const priorityOptions = [
    { value: 'low', label: 'Low Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'high', label: 'High Priority' },
    { value: 'urgent', label: 'Urgent' },
  ]

  if (fetchingData) {
    return (
      <FormModal
        isOpen={isOpen}
        onClose={handleClose}
        title="Schedule Maintenance Visit"
        size="lg"
      >
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-2">Loading contracts...</span>
        </div>
      </FormModal>
    )
  }

  if (contracts.length === 0) {
    return (
      <FormModal
        isOpen={isOpen}
        onClose={handleClose}
        title="Schedule Maintenance Visit"
        size="lg"
      >
        <div className="text-center py-8">
          <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Contracts</h3>
          <p className="text-gray-600 mb-4">
            You need to create a maintenance contract before scheduling visits.
          </p>
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Close
          </button>
        </div>
      </FormModal>
    )
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Schedule Maintenance Visit"
      description="Choose a contract and set priority for automatic scheduling"
      size="xl"
      onSubmit={form.handleSubmit(handleSubmit)}
      loading={loading}
      submitText="Schedule Visit"
      submitDisabled={!selectedContract || !scheduleInfo}
    >
      <Form {...form}>
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <h3 className="font-semibold text-gray-900">Select Contract</h3>
            </div>
            
            {/* Searchable Input */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maintenance Contract <span className="text-red-500">*</span>
              </label>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setShowDropdown(true)
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Search by customer, product, or frequency..."
                  className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                />
                
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Dropdown Suggestions */}
              {showDropdown && filteredContracts.length > 0 && (
                <div 
                  ref={dropdownRef}
                  className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
                >
                  {filteredContracts.map((contract) => (
                    <button
                      key={contract.id}
                      type="button"
                      onClick={() => handleContractSelect(contract)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{contract.customer_name}</div>
                          <div className="text-sm text-gray-600 mt-0.5">
                            {contract.product.name}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              {contract.frequency}
                            </span>
                            {contract.customer_phone && (
                              <span className="text-xs text-gray-500"> {contract.customer_phone}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}


              {showDropdown && searchQuery && filteredContracts.length === 0 && (
                <div 
                  ref={dropdownRef}
                  className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500"
                >
                  <MagnifyingGlassIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No contracts found matching "{searchQuery}"</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <h3 className="font-semibold text-gray-900">Set Priority</h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {priorityOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => form.setValue('priority', option.value as any)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    form.watch('priority') === option.value
                      ? option.value === 'urgent'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : option.value === 'high'
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : option.value === 'medium'
                        ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                        : 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="font-semibold text-sm">{option.label}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selectedContract && scheduleInfo ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">Schedule Preview</h3>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-blue-50 border-2 border-blue-200 rounded-xl p-5">

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {/* Date Card - Editable */}
                  <button
                    type="button"
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1">
                      <CalendarIcon className="h-4 w-4" />
                      <span>Date</span>
                    </div>
                    <div className="font-bold text-gray-900">
                      {moment(scheduleInfo.date).format('MMM DD, YYYY')}
                    </div>
                    <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                      <span>Click to change</span>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Time Card - Editable */}
                  <button
                    type="button"
                    onClick={handleTimeSlotClick}
                    className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1">
                      <ClockIcon className="h-4 w-4" />
                      <span>Time</span>
                    </div>
                    <div className="font-bold text-gray-900">
                      {moment(scheduleInfo.suggested_time, 'HH:mm').format('h:mm A')}
                    </div>
                    <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                      <span>Click to change</span>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Technician Card - Editable */}
                  <button
                    type="button"
                    onClick={() => setShowWorkerDropdown(!showWorkerDropdown)}
                    className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1">
                      <UserIcon className="h-4 w-4" />
                      <span>Technician</span>
                    </div>
                    <div className="font-bold text-gray-900 truncate" title={scheduleInfo.technician_name}>
                      {selectedWorker?.name || scheduleInfo.technician_name}
                    </div>
                    <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                      <span>Click to change</span>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Workload Card - Read Only */}
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1">
                      <ChartBarIcon className="h-4 w-4" />
                      <span>Workload</span>
                    </div>
                    <div className="font-bold text-gray-900">
                      {scheduleInfo.visits_count} {scheduleInfo.visits_count === 1 ? 'visit' : 'visits'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      That day
                    </div>
                  </div>
                </div>

                {/* Date Picker Dropdown */}
                {showDatePicker && (
                  <div className="mb-4 bg-white rounded-lg p-4 shadow-lg border-2 border-blue-300">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">Select Date</h4>
                      <button
                        type="button"
                        onClick={() => setShowDatePicker(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                    <input
                      type="date"
                      value={selectedDate || scheduleInfo.date}
                      onChange={(e) => handleDateChange(e.target.value)}
                      min={moment().format('YYYY-MM-DD')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                )}

                {/* Time Slots Dropdown */}
                {showTimeSlots && (
                  <div className="mb-4 bg-white rounded-lg p-4 shadow-lg border-2 border-blue-300">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">Select Time Slot</h4>
                      <button
                        type="button"
                        onClick={() => setShowTimeSlots(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto">
                      {availableTimeSlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => handleTimeSelect(slot)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            scheduleInfo.suggested_time === slot
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {moment(slot, 'HH:mm').format('h:mm A')}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Worker/Technician Dropdown */}
                {showWorkerDropdown && (
                  <div className="mb-4 bg-white rounded-lg p-4 shadow-lg border-2 border-blue-300">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">Select Technician</h4>
                      <button
                        type="button"
                        onClick={() => setShowWorkerDropdown(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {workers.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">No technicians available</p>
                      ) : (
                        workers.map((worker) => (
                          <button
                            key={worker.id}
                            type="button"
                            onClick={() => handleWorkerSelect(worker)}
                            className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                              selectedWorker?.id === worker.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <div className="font-medium">{worker.name}</div>
                            <div className="text-sm opacity-90">{worker.job_title}</div>
                            {worker.phone && (
                              <div className="text-xs opacity-75 mt-1">{worker.phone}</div>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Customer & Product Info */}
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-1">Customer</div>
                      <div className="font-semibold text-gray-900">{selectedContract.customer_name}</div>
                      {selectedContract.customer_phone && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-600 mt-1">
                          <PhoneIcon className="h-4 w-4" />
                          <span>{selectedContract.customer_phone}</span>
                        </div>
                      )}
                      {selectedContract.customer_address && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-600 mt-1">
                          <MapPinIcon className="h-4 w-4" />
                          <span>{selectedContract.customer_address}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-1">Service Details</div>
                      <div className="font-semibold text-gray-900">{selectedContract.product.name}</div>
                      <div className="flex items-center gap-1.5 text-sm text-gray-600 mt-1">
                        <WrenchScrewdriverIcon className="h-4 w-4" />
                        <span>{selectedContract.frequency.charAt(0).toUpperCase() + selectedContract.frequency.slice(1)} maintenance</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-sm font-medium text-gray-600">Select a contract to preview schedule</p>
              <p className="text-xs text-gray-500 mt-1">We'll automatically calculate the best date and time</p>
            </div>
          )}
        </div>
      </Form>
    </FormModal>
  )
}
