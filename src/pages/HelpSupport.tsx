import React, { useState } from 'react';
import { HelpCircle, BookOpen, MessageCircle, Phone, Mail, Search, ChevronRight, ChevronDown, FileText, Video, ArrowRight, ExternalLink, Send } from 'lucide-react';
const HelpSupport = () => {
  const [activeTab, setActiveTab] = useState('faq');
  return <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-md p-8 text-white">
        <h1 className="text-2xl font-bold mb-3">How can we help you?</h1>
        <p className="mb-6 text-blue-100">
          Find answers to your questions or contact our support team
        </p>
        <div className="relative max-w-3xl">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={20} className="text-gray-400" />
          </div>
          <input type="text" placeholder="Search for help topics..." className="block w-full pl-10 pr-4 py-3 border border-blue-400 rounded-md bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent" />
        </div>
      </div>
      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex flex-wrap border-b border-gray-200">
          <button onClick={() => setActiveTab('faq')} className={`px-6 py-4 text-sm font-medium ${activeTab === 'faq' ? 'text-blue-700 border-b-2 border-blue-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'}`}>
            <HelpCircle size={18} className="inline-block mr-2" />
            FAQs
          </button>
          <button onClick={() => setActiveTab('guides')} className={`px-6 py-4 text-sm font-medium ${activeTab === 'guides' ? 'text-blue-700 border-b-2 border-blue-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'}`}>
            <BookOpen size={18} className="inline-block mr-2" />
            User Guides
          </button>
          <button onClick={() => setActiveTab('contact')} className={`px-6 py-4 text-sm font-medium ${activeTab === 'contact' ? 'text-blue-700 border-b-2 border-blue-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'}`}>
            <MessageCircle size={18} className="inline-block mr-2" />
            Contact Support
          </button>
        </div>
        <div className="p-6">
          {activeTab === 'faq' && <FAQSection />}
          {activeTab === 'guides' && <GuidesSection />}
          {activeTab === 'contact' && <ContactSection />}
        </div>
      </div>
    </div>;
};
const FAQSection = () => {
  const [openFaq, setOpenFaq] = useState(null);
  const faqs = [{
    id: 1,
    question: 'How do I book an appointment for a corporate client?',
    answer: "To book an appointment for a corporate client, navigate to the Doctor Search page, select the required doctor and time slot, then choose 'Corporate Booking' from the booking type dropdown. Enter the client's details and company information. You can also add multiple patients for group bookings."
  }, {
    id: 2,
    question: 'How can I cancel or reschedule an appointment?',
    answer: "To cancel or reschedule an appointment, go to the Appointments page, find the appointment you wish to modify, and click the edit icon (pencil) to reschedule or the cancel icon (X) to cancel. For rescheduling, you'll be able to select a new date and time. Cancellations may be subject to the cancellation policy."
  }, {
    id: 3,
    question: 'How do I process a refund for a cancelled appointment?',
    answer: "To process a refund, go to the Payments section, locate the payment associated with the cancelled appointment, and click the 'Process Refund' button. You'll need to select a reason for the refund and confirm the refund amount. Refunds typically take 3-5 business days to appear in the client's account."
  }, {
    id: 4,
    question: 'How can I generate reports for corporate clients?',
    answer: "To generate reports for corporate clients, go to the Reports section, select 'Corporate Reports' from the report type dropdown, choose the client company from the list, set the date range, and select the type of report you need (appointments, payments, etc.). Click 'Generate Report' to create the report, which can then be exported as PDF or Excel."
  }, {
    id: 5,
    question: 'What should I do if a payment fails?',
    answer: "If a payment fails, you'll see a 'Payment Failed' status on the appointment. You should contact the client to inform them of the issue and provide alternative payment options. You can initiate a new payment request by going to the appointment details and clicking 'Request Payment'. The system will send a payment link to the client."
  }, {
    id: 6,
    question: 'How do I set up special rates for corporate clients?',
    answer: 'Corporate rates are managed by administrators. However, you can request special rates by contacting the admin team with details of the corporate client and the proposed rate structure. Once approved, these special rates will automatically apply when you book appointments for that corporate client.'
  }];
  const toggleFaq = id => {
    if (openFaq === id) {
      setOpenFaq(null);
    } else {
      setOpenFaq(id);
    }
  };
  return <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        Frequently Asked Questions
      </h2>
      <div className="space-y-4">
        {faqs.map(faq => <div key={faq.id} className="border border-gray-200 rounded-lg overflow-hidden">
            <button className="w-full flex justify-between items-center p-4 text-left bg-gray-50 hover:bg-gray-100 focus:outline-none" onClick={() => toggleFaq(faq.id)}>
              <span className="font-medium text-gray-800">{faq.question}</span>
              {openFaq === faq.id ? <ChevronDown size={20} className="text-gray-500" /> : <ChevronRight size={20} className="text-gray-500" />}
            </button>
            {openFaq === faq.id && <div className="p-4 bg-white border-t border-gray-200">
                <p className="text-gray-700">{faq.answer}</p>
              </div>}
          </div>)}
      </div>
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200 flex items-center">
        <div className="mr-4 text-blue-500">
          <HelpCircle size={24} />
        </div>
        <div>
          <h3 className="font-medium text-blue-800">
            Can't find what you're looking for?
          </h3>
          <p className="text-sm text-blue-600">
            Contact our support team for personalized assistance.
          </p>
        </div>
        <button className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 whitespace-nowrap" onClick={() => setActiveTab('contact')}>
          Contact Support
        </button>
      </div>
    </div>;
};
const GuidesSection = () => {
  const guides = [{
    id: 1,
    title: 'Getting Started with Corporate Agent Portal',
    description: 'Learn the basics of the Corporate Agent Portal and how to navigate the system.',
    icon: <FileText size={40} className="text-blue-600" />,
    type: 'PDF Guide'
  }, {
    id: 2,
    title: 'Managing Appointments for Corporate Clients',
    description: 'A comprehensive guide on booking, rescheduling, and cancelling appointments.',
    icon: <Video size={40} className="text-blue-600" />,
    type: 'Video Tutorial'
  }, {
    id: 3,
    title: 'Processing Payments and Refunds',
    description: 'Step-by-step instructions for handling payments and processing refunds.',
    icon: <FileText size={40} className="text-blue-600" />,
    type: 'PDF Guide'
  }, {
    id: 4,
    title: 'Generating and Analyzing Reports',
    description: 'Learn how to create, customize, and interpret different types of reports.',
    icon: <Video size={40} className="text-blue-600" />,
    type: 'Video Tutorial'
  }, {
    id: 5,
    title: 'Doctor Search and Filtering Options',
    description: 'Tips and tricks for finding the right doctors for your corporate clients.',
    icon: <FileText size={40} className="text-blue-600" />,
    type: 'PDF Guide'
  }, {
    id: 6,
    title: 'Handling Special Requests and Bulk Bookings',
    description: 'Advanced techniques for managing complex booking scenarios.',
    icon: <Video size={40} className="text-blue-600" />,
    type: 'Video Tutorial'
  }];
  return <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        User Guides & Tutorials
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {guides.map(guide => <div key={guide.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6 flex flex-col h-full">
              <div className="mb-4">
                {guide.icon}
                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-2">
                  {guide.type}
                </span>
              </div>
              <h3 className="font-medium text-gray-800 mb-2">{guide.title}</h3>
              <p className="text-sm text-gray-600 mb-4 flex-grow">
                {guide.description}
              </p>
              <a href="#" className="text-blue-600 hover:text-blue-800 font-medium flex items-center text-sm mt-2">
                View Guide <ArrowRight size={16} className="ml-1" />
              </a>
            </div>
          </div>)}
      </div>
      <div className="mt-8 border-t border-gray-200 pt-6">
        <h3 className="font-medium text-gray-800 mb-4">Video Tutorials</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex items-center">
            <div className="w-24 h-16 bg-gray-300 rounded flex items-center justify-center mr-4">
              <Video size={24} className="text-gray-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-800">
                Corporate Booking Walkthrough
              </h4>
              <p className="text-xs text-gray-500 mb-1">Duration: 5:42</p>
              <a href="#" className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
                Watch <ExternalLink size={14} className="ml-1" />
              </a>
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex items-center">
            <div className="w-24 h-16 bg-gray-300 rounded flex items-center justify-center mr-4">
              <Video size={24} className="text-gray-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-800">
                Advanced Reporting Features
              </h4>
              <p className="text-xs text-gray-500 mb-1">Duration: 7:15</p>
              <a href="#" className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
                Watch <ExternalLink size={14} className="ml-1" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
const ContactSection = () => {
  return <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        Contact Support
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
              <Phone size={24} className="text-blue-700" />
            </div>
            <div>
              <h3 className="font-medium text-gray-800">Call Us</h3>
              <p className="text-sm text-gray-600">
                Available 9 AM - 6 PM, Mon-Fri
              </p>
            </div>
          </div>
          <a href="tel:+94112345678" className="text-lg font-medium text-blue-700 block mb-2">
            +94 11 234 5678
          </a>
          <p className="text-sm text-gray-600">
            For urgent issues, please call our support hotline for immediate
            assistance.
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
              <Mail size={24} className="text-green-700" />
            </div>
            <div>
              <h3 className="font-medium text-gray-800">Email Support</h3>
              <p className="text-sm text-gray-600">Response within 24 hours</p>
            </div>
          </div>
          <a href="mailto:corporate-support@echannelling.com" className="text-md font-medium text-green-700 block mb-2">
            corporate-support@echannelling.com
          </a>
          <p className="text-sm text-gray-600">
            Send us detailed information about your issue for thorough
            assistance.
          </p>
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-medium text-gray-800 mb-4">
          Send a Support Request
        </h3>
        <form className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Your Name
              </label>
              <input type="text" id="name" className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" defaultValue="Sarah Johnson" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input type="email" id="email" className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" defaultValue="sarah.johnson@company.com" />
            </div>
          </div>
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input type="text" id="subject" className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Brief description of your issue" />
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Issue Category
            </label>
            <select id="category" className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">Select a category</option>
              <option value="appointment">Appointment Issues</option>
              <option value="payment">Payment Problems</option>
              <option value="technical">Technical Difficulties</option>
              <option value="account">Account Management</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea id="message" rows={5} className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Please provide details about your issue..."></textarea>
          </div>
          <div>
            <label htmlFor="attachments" className="block text-sm font-medium text-gray-700 mb-1">
              Attachments (Optional)
            </label>
            <div className="border border-dashed border-gray-300 rounded-md p-4 text-center">
              <input type="file" id="attachments" className="hidden" />
              <label htmlFor="attachments" className="cursor-pointer text-blue-600 hover:text-blue-800">
                Click to upload files
              </label>
              <p className="text-xs text-gray-500 mt-1">
                You can upload screenshots or documents (Max 5MB)
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center">
              <Send size={16} className="mr-2" />
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>;
};
export default HelpSupport;