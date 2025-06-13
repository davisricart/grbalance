// Enhanced User Interface Updates for Consultation-Gated Workflow
// Updates needed for AdminPage.tsx and related components

// 1. ENHANCED USER INTERFACE TYPES
interface EnhancedUser extends ApprovedUser {
  status: 'pending' | 'consultation_scheduled' | 'consultation_completed' | 
          'script_development' | 'trial_ready' | 'trial_active' | 'billing_active' | 'rejected';
  
  // Consultation fields
  consultationDate?: string;
  consultationNotes?: string;
  consultationFit?: 'good_fit' | 'poor_fit' | 'unknown';
  
  // Script development fields
  scriptRequirements?: string;
  scriptComplexity?: 'simple' | 'medium' | 'complex';
  scriptCompletedAt?: string;
  customScriptId?: string;
  
  // Trial fields
  trialStartedAt?: string;
  trialEndsAt?: string;
  trialActivatedBy?: string;
  
  // Engagement tracking
  lastActiveAt?: string;
  engagementScore?: number;
  scriptUsageCount?: number;
}

// 2. NEW ADMIN TABS CONFIGURATION
const ENHANCED_ADMIN_TABS = [
  { id: 'pending', label: 'Pending Review', icon: Clock },
  { id: 'consultations', label: 'Consultations', icon: Calendar },
  { id: 'script-dev', label: 'Script Development', icon: Code },
  { id: 'trial-ready', label: 'Trial Ready', icon: Play },
  { id: 'active-trials', label: 'Active Trials', icon: Timer },
  { id: 'paying', label: 'Paying Customers', icon: CreditCard }
];

// 3. CONSULTATION SCHEDULING COMPONENT
const ConsultationScheduler = ({ user, onSchedule, onClose }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-lg font-medium mb-4">Schedule Consultation</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Client</label>
            <p className="text-sm text-gray-900">{user.email}</p>
            <p className="text-xs text-gray-500">{user.businessName}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Time</label>
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Select time...</option>
              <option value="09:00">9:00 AM</option>
              <option value="10:00">10:00 AM</option>
              <option value="11:00">11:00 AM</option>
              <option value="14:00">2:00 PM</option>
              <option value="15:00">3:00 PM</option>
              <option value="16:00">4:00 PM</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Prep Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Key points to discuss, requirements to explore..."
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 h-20"
            />
          </div>
        </div>
        
        <div className="mt-6 flex space-x-3">
          <button
            onClick={() => onSchedule({
              date: selectedDate,
              time: selectedTime,
              notes
            })}
            disabled={!selectedDate || !selectedTime}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            Schedule Consultation
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// 4. POST-CONSULTATION ASSESSMENT COMPONENT
const ConsultationAssessment = ({ user, onComplete, onClose }) => {
  const [fit, setFit] = useState('');
  const [requirements, setRequirements] = useState('');
  const [complexity, setComplexity] = useState('');
  const [notes, setNotes] = useState('');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-lg w-full p-6">
        <h3 className="text-lg font-medium mb-4">Consultation Assessment</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Client Fit Assessment</label>
            <div className="mt-2 space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="good_fit"
                  checked={fit === 'good_fit'}
                  onChange={(e) => setFit(e.target.value)}
                  className="mr-2"
                />
                <span className="text-green-700">✅ Good fit - proceed with script development</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="poor_fit"
                  checked={fit === 'poor_fit'}
                  onChange={(e) => setFit(e.target.value)}
                  className="mr-2"
                />
                <span className="text-red-700">❌ Poor fit - politely decline</span>
              </label>
            </div>
          </div>
          
          {fit === 'good_fit' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">Script Requirements</label>
                <textarea
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="Describe the custom script needed for this client..."
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 h-24"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Development Complexity</label>
                <select
                  value={complexity}
                  onChange={(e) => setComplexity(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Select complexity...</option>
                  <option value="simple">Simple (1-2 days)</option>
                  <option value="medium">Medium (3-4 days)</option>
                  <option value="complex">Complex (5+ days)</option>
                </select>
              </div>
            </>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Additional Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Call summary, concerns, follow-up items..."
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 h-20"
            />
          </div>
        </div>
        
        <div className="mt-6 flex space-x-3">
          <button
            onClick={() => onComplete({
              fit,
              requirements,
              complexity,
              notes
            })}
            disabled={!fit}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Complete Assessment
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// 5. STATUS-BASED USER CARDS
const EnhancedUserCard = ({ user, onAction }) => {
  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        color: 'yellow',
        icon: Clock,
        action: 'Schedule Consultation',
        actionColor: 'blue'
      },
      consultation_scheduled: {
        color: 'blue',
        icon: Calendar,
        action: 'Mark Complete',
        actionColor: 'green'
      },
      consultation_completed: {
        color: 'purple',
        icon: CheckCircle,
        action: 'Start Script Dev',
        actionColor: 'blue'
      },
      script_development: {
        color: 'orange',
        icon: Code,
        action: 'Mark Complete',
        actionColor: 'green'
      },
      trial_ready: {
        color: 'green',
        icon: Play,
        action: 'View Script',
        actionColor: 'blue'
      },
      trial_active: {
        color: 'blue',
        icon: Timer,
        action: 'View Usage',
        actionColor: 'gray'
      }
    };
    return configs[status] || configs.pending;
  };

  const config = getStatusConfig(user.status);
  const IconComponent = config.icon;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-full bg-${config.color}-100 flex items-center justify-center`}>
            <IconComponent className={`w-5 h-5 text-${config.color}-600`} />
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{user.email}</h4>
            <p className="text-sm text-gray-500">{user.businessName}</p>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-${config.color}-100 text-${config.color}-800`}>
              {user.status.replace('_', ' ')}
            </span>
          </div>
        </div>
        
        <button
          onClick={() => onAction(user)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md bg-${config.actionColor}-600 text-white hover:bg-${config.actionColor}-700`}
        >
          {config.action}
        </button>
      </div>
      
      {/* Status-specific details */}
      <div className="mt-3 text-xs text-gray-500">
        {user.consultationDate && (
          <p>📅 Consultation: {new Date(user.consultationDate).toLocaleDateString()}</p>
        )}
        {user.trialEndsAt && (
          <p>⏰ Trial ends: {Math.ceil((new Date(user.trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24))} days</p>
        )}
        {user.scriptComplexity && (
          <p>⚙️ Script complexity: {user.scriptComplexity}</p>
        )}
      </div>
    </div>
  );
};

// 6. NEW ADMIN ACTIONS
const enhancedAdminActions = {
  scheduleConsultation: async (userId, consultationData) => {
    const updateData = {
      status: 'consultation_scheduled',
      consultationDate: `${consultationData.date}T${consultationData.time}`,
      consultationNotes: consultationData.notes,
      updatedAt: new Date().toISOString()
    };
    
    await updateDoc(doc(db, 'usage', userId), updateData);
    
    // Send email to user with consultation details
    // TODO: Email integration
  },

  completeConsultation: async (userId, assessmentData) => {
    const updateData = {
      status: assessmentData.fit === 'good_fit' ? 'script_development' : 'rejected',
      consultationFit: assessmentData.fit,
      scriptRequirements: assessmentData.requirements,
      scriptComplexity: assessmentData.complexity,
      consultationCompletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await updateDoc(doc(db, 'usage', userId), updateData);
  },

  completeScriptDevelopment: async (userId, scriptId) => {
    const updateData = {
      status: 'trial_ready',
      customScriptId: scriptId,
      scriptCompletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await updateDoc(doc(db, 'usage', userId), updateData);
    
    // Send email to user that script is ready
    // TODO: Email integration
  }
};

// IMPLEMENTATION NOTES:
// 1. Add these components to your AdminPage.tsx
// 2. Update the tab navigation to use ENHANCED_ADMIN_TABS
// 3. Replace current approval flow with consultation scheduling
// 4. Add the new admin actions to your existing functions
// 5. Update database schema to include new fields 