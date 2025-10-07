import { useState } from 'react';
import { Search, MessageCircle, Phone, Mail, Book, Video, Download, ChevronDown, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/layout/DashboardLayout';

const HelpSupport = () => {
  const [activeSection, setActiveSection] = useState('faq');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [supportForm, setSupportForm] = useState({
    subject: '',
    category: '',
    priority: 'medium',
    message: ''
  });

  const faqData = [
    {
      id: 1,
      question: 'How do I book an appointment for a patient?',
      answer: 'To book an appointment, go to the Doctor Search page, find the desired doctor, and click "Book Appointment". Fill in the patient details and select your preferred time slot.'
    },
    {
      id: 2,
      question: 'What payment methods are accepted?',
      answer: 'We accept credit cards, debit cards, bank transfers, and cash payments. All online payments are processed securely through our payment gateway.'
    },
    {
      id: 3,
      question: 'How can I cancel an appointment?',
      answer: 'You can cancel appointments from the Appointment Management page. Select the appointment and click the cancel button. Please note that cancellation policies may vary by hospital.'
    },
    {
      id: 4,
      question: 'How do I track my commission earnings?',
      answer: 'Your commission earnings are tracked automatically. You can view detailed reports in the Reports section, which shows your earnings by month, hospital, and specialty.'
    },
    {
      id: 5,
      question: 'Can I book multiple appointments at once?',
      answer: 'Yes, you can use the Bulk Booking feature to book multiple appointments simultaneously. This is especially useful for corporate clients with multiple employees.'
    },
    {
      id: 6,
      question: 'How do I reset my password?',
      answer: 'Go to the login page and click "Forgot Password". Enter your email address and follow the instructions sent to your email to reset your password.'
    }
  ];

  const contactMethods = [
    {
      icon: Phone,
      title: 'Phone Support',
      description: 'Call our support team',
      contact: '+94 11 234 5678',
      hours: '24/7 Available'
    },
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Send us an email',
      contact: 'support@echanneling.com',
      hours: 'Response within 24 hours'
    },
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Chat with our support team',
      contact: 'Start Chat',
      hours: '9 AM - 6 PM'
    }
  ];

  const resources = [
    {
      title: 'User Manual',
      description: 'Complete guide to using the platform',
      icon: Book,
      type: 'PDF'
    },
    {
      title: 'Video Tutorials',
      description: 'Step-by-step video guides',
      icon: Video,
      type: 'Video'
    },
    {
      title: 'API Documentation',
      description: 'Technical documentation for developers',
      icon: Download,
      type: 'Web'
    }
  ];

  const filteredFaqs = faqData.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSupportSubmit = () => {
    if (!supportForm.subject || !supportForm.message) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    toast.success('Support ticket submitted successfully. We will get back to you soon.');
    setSupportForm({
      subject: '',
      category: '',
      priority: 'medium',
      message: ''
    });
  };

  const renderFAQ = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Frequently Asked Questions</h3>
        
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search FAQs..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {filteredFaqs.map((faq) => (
            <div key={faq.id} className="border border-gray-200 rounded-lg">
              <button
                onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50"
              >
                <span className="font-medium text-gray-900">{faq.question}</span>
                {expandedFaq === faq.id ? (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-500" />
                )}
              </button>
              {expandedFaq === faq.id && (
                <div className="px-6 pb-4 text-gray-600">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderContactSupport = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Support</h3>
        
        {/* Contact Methods */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {contactMethods.map((method, index) => {
            const Icon = method.icon;
            return (
              <div key={index} className="bg-gray-50 rounded-lg p-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">{method.title}</h4>
                <p className="text-gray-600 mb-2">{method.description}</p>
                <p className="text-blue-600 font-medium">{method.contact}</p>
                <p className="text-sm text-gray-500">{method.hours}</p>
              </div>
            );
          })}
        </div>

        {/* Support Form */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Submit a Support Ticket</h4>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                <input
                  type="text"
                  value={supportForm.subject}
                  onChange={(e) => setSupportForm(prev => ({...prev, subject: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Brief description of the issue"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={supportForm.category}
                  onChange={(e) => setSupportForm(prev => ({...prev, category: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Category</option>
                  <option value="technical">Technical Issue</option>
                  <option value="billing">Billing & Payments</option>
                  <option value="appointments">Appointments</option>
                  <option value="account">Account Management</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={supportForm.priority}
                onChange={(e) => setSupportForm(prev => ({...prev, priority: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
              <textarea
                value={supportForm.message}
                onChange={(e) => setSupportForm(prev => ({...prev, message: e.target.value}))}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Please describe your issue in detail..."
              />
            </div>
            
            <button
              onClick={handleSupportSubmit}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Submit Ticket
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderResources = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resources & Documentation</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {resources.map((resource, index) => {
            const Icon = resource.icon;
            return (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{resource.type}</span>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">{resource.title}</h4>
                <p className="text-gray-600 mb-4">{resource.description}</p>
                <button className="text-blue-600 hover:text-blue-700 font-medium">
                  Access Resource →
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const sections = [
    { id: 'faq', name: 'FAQ', component: renderFAQ },
    { id: 'contact', name: 'Contact Support', component: renderContactSupport },
    { id: 'resources', name: 'Resources', component: renderResources }
  ];

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Help & Support</h1>
          <p className="text-gray-600 text-sm sm:text-base">Get help and find answers to your questions</p>
        </div>

        {/* Section Navigation */}
        <div className="bg-white rounded-lg shadow-sm border mb-4 sm:mb-6">
          <nav className="flex space-x-4 sm:space-x-8 px-4 sm:px-6 overflow-x-auto">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeSection === section.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {section.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
          {sections.find(section => section.id === activeSection)?.component()}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HelpSupport;