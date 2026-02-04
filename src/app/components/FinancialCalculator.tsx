import { useState } from 'react';
import { DollarSign, Download, Calculator, AlertCircle } from 'lucide-react';

interface CourseFee {
  code: string;
  name: string;
  credits: number;
  tuitionCost: number;
  labFee?: number;
  specialFee?: number;
}

export function FinancialCalculator() {
  const [selectedSemester, setSelectedSemester] = useState('Fall 2024');
  
  // Mock financial data
  const tuitionPerCredit = 415; // TTD per credit
  const generalFee = 1250; // TTD per semester
  const studentActivityFee = 300;
  const technologyFee = 500;
  const libraryFee = 200;
  const labFeeStandard = 350;

  const semesterCourses: CourseFee[] = [
    { code: 'CPTR360', name: 'Data Structures', credits: 3, tuitionCost: 3 * tuitionPerCredit },
    { code: 'CPTR280', name: 'Database Systems', credits: 3, tuitionCost: 3 * tuitionPerCredit, labFee: labFeeStandard },
    { code: 'MATH245', name: 'Discrete Mathematics', credits: 3, tuitionCost: 3 * tuitionPerCredit },
    { code: 'PHYS201', name: 'Physics for Scientists I', credits: 4, tuitionCost: 4 * tuitionPerCredit, labFee: labFeeStandard },
    { code: 'COMM101', name: 'Public Speaking', credits: 3, tuitionCost: 3 * tuitionPerCredit },
  ];

  const totalCredits = semesterCourses.reduce((sum, c) => sum + c.credits, 0);
  const tuitionSubtotal = semesterCourses.reduce((sum, c) => sum + c.tuitionCost, 0);
  const labFeesSubtotal = semesterCourses.reduce((sum, c) => sum + (c.labFee || 0), 0);
  const generalFeesTotal = generalFee + studentActivityFee + technologyFee + libraryFee;
  const grandTotal = tuitionSubtotal + labFeesSubtotal + generalFeesTotal;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TT', {
      style: 'currency',
      currency: 'TTD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const exportClearanceLetter = () => {
    alert('Generating Financial Clearance Letter PDF...\n\nThis would download a PDF that can be sent to parents or the scholarship office.');
  };

  return (
    <div className="h-full bg-gray-50 overflow-y-auto">
      <div className="max-w-6xl mx-auto p-8 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#003366] rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl text-gray-900">Financial Calculator</h2>
                <p className="text-sm text-gray-600">
                  Real-time cost breakdown for your planned semester
                </p>
              </div>
            </div>
            <button
              onClick={exportClearanceLetter}
              className="flex items-center gap-2 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#00254d] transition-colors"
            >
              <Download className="w-5 h-5" />
              Export Letter
            </button>
          </div>
        </div>

        {/* Semester Selector */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <label className="block text-sm text-gray-700 mb-2">Select Semester</label>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003366]"
          >
            <option>Fall 2024</option>
            <option>Spring 2025</option>
            <option>Fall 2025</option>
            <option>Spring 2026</option>
          </select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Total Credits</p>
            <p className="text-2xl text-gray-900">{totalCredits}</p>
          </div>
          <div className="bg-blue-50 rounded-lg shadow-sm border border-blue-200 p-4">
            <p className="text-sm text-blue-700 mb-1">Tuition</p>
            <p className="text-2xl text-blue-900">{formatCurrency(tuitionSubtotal)}</p>
          </div>
          <div className="bg-purple-50 rounded-lg shadow-sm border border-purple-200 p-4">
            <p className="text-sm text-purple-700 mb-1">Fees</p>
            <p className="text-2xl text-purple-900">{formatCurrency(generalFeesTotal + labFeesSubtotal)}</p>
          </div>
          <div className="bg-[#003366] rounded-lg shadow-md p-4">
            <p className="text-sm text-white/80 mb-1">Grand Total</p>
            <p className="text-2xl text-white">{formatCurrency(grandTotal)}</p>
          </div>
        </div>

        {/* Course Breakdown */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg text-gray-900">Course Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs text-gray-500">Course Code</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-500">Course Name</th>
                  <th className="px-6 py-3 text-center text-xs text-gray-500">Credits</th>
                  <th className="px-6 py-3 text-right text-xs text-gray-500">Tuition</th>
                  <th className="px-6 py-3 text-right text-xs text-gray-500">Lab Fee</th>
                  <th className="px-6 py-3 text-right text-xs text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {semesterCourses.map((course) => (
                  <tr key={course.code} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{course.code}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{course.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-center">{course.credits}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right">{formatCurrency(course.tuitionCost)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right">
                      {course.labFee ? formatCurrency(course.labFee) : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right">
                      {formatCurrency(course.tuitionCost + (course.labFee || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* General Fees Breakdown */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg text-gray-900">General Fees</h3>
          </div>
          <div className="p-6 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700">General Fee</span>
              <span className="text-gray-900">{formatCurrency(generalFee)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700">Student Activity Fee</span>
              <span className="text-gray-900">{formatCurrency(studentActivityFee)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700">Technology Fee</span>
              <span className="text-gray-900">{formatCurrency(technologyFee)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700">Library Fee</span>
              <span className="text-gray-900">{formatCurrency(libraryFee)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700">Lab Fees</span>
              <span className="text-gray-900">{formatCurrency(labFeesSubtotal)}</span>
            </div>
            <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
              <span className="text-gray-900">Total Fees</span>
              <span className="text-lg text-gray-900">{formatCurrency(generalFeesTotal + labFeesSubtotal)}</span>
            </div>
          </div>
        </div>

        {/* Payment Schedule */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start gap-3 mb-4">
            <Calculator className="w-5 h-5 text-[#003366] mt-0.5" />
            <div>
              <h3 className="text-lg text-gray-900 mb-1">Payment Plan Options</h3>
              <p className="text-sm text-gray-600">Choose a payment schedule that works for you</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-gray-200 rounded-lg p-4 hover:border-[#003366] cursor-pointer transition-colors">
              <p className="text-sm text-gray-600 mb-2">Full Payment</p>
              <p className="text-xl text-gray-900 mb-1">{formatCurrency(grandTotal)}</p>
              <p className="text-xs text-green-600">5% discount applied</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4 hover:border-[#003366] cursor-pointer transition-colors">
              <p className="text-sm text-gray-600 mb-2">2 Installments</p>
              <p className="text-xl text-gray-900 mb-1">{formatCurrency(grandTotal / 2)}/month</p>
              <p className="text-xs text-gray-500">No additional fees</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4 hover:border-[#003366] cursor-pointer transition-colors">
              <p className="text-sm text-gray-600 mb-2">4 Installments</p>
              <p className="text-xl text-gray-900 mb-1">{formatCurrency(grandTotal / 4)}/month</p>
              <p className="text-xs text-gray-500">2% processing fee</p>
            </div>
          </div>
        </div>

        {/* Important Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <p className="text-sm text-yellow-900">Important Notice</p>
            <p className="text-sm text-yellow-700 mt-1">
              Tuition rates are subject to change. Lab fees apply to courses with laboratory components. 
              Additional fees may apply for special programs or resources. Contact the Bursar's Office for specific questions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
