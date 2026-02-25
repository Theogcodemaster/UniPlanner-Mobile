import { useState } from 'react';
import { DollarSign, Download, Calculator, AlertCircle, TrendingUp, CreditCard, Wallet, BookOpen, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface CourseFee {
  code: string;
  name: string;
  credits: number;
  tuitionCost: number;
  labFee?: number;
}

export function FinancialCalculator() {
  const [selectedSemester, setSelectedSemester] = useState('Fall 2024');
  
  const tuitionPerCredit = 415;
  const generalFee = 1250;
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

  const tuitionSubtotal = semesterCourses.reduce((sum, c) => sum + c.tuitionCost, 0);
  const labFeesSubtotal = semesterCourses.reduce((sum, c) => sum + (c.labFee || 0), 0);
  const generalFeesTotal = generalFee + studentActivityFee + technologyFee + libraryFee;
  const grandTotal = tuitionSubtotal + labFeesSubtotal + generalFeesTotal;

  const chartData = [
    { name: 'Tuition', value: tuitionSubtotal, color: '#003366' },
    { name: 'Lab Fees', value: labFeesSubtotal, color: '#FDB515' },
    { name: 'General Fees', value: generalFeesTotal, color: '#3b82f6' },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TT', {
      style: 'currency',
      currency: 'TTD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-8 pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Wallet className="w-6 h-6 text-[#003366]" />
              Financial Calculator
            </h2>
            <p className="text-sm text-slate-500 mt-1">Real-time cost breakdown and automated payment forecasting.</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-100 outline-none shadow-sm transition-all"
            >
              <option>Fall 2024</option>
              <option>Spring 2025</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all font-medium">
              <Download className="w-4 h-4" /> Export PDF
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 pb-8 space-y-6">
        {/* Top Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
             <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tuition</span>
                <DollarSign className="w-4 h-4 text-blue-500" />
             </div>
             <p className="text-2xl font-bold text-slate-900">{formatCurrency(tuitionSubtotal)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
             <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fees</span>
                <CreditCard className="w-4 h-4 text-amber-500" />
             </div>
             <p className="text-2xl font-bold text-slate-900">{formatCurrency(generalFeesTotal + labFeesSubtotal)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
             <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Grand Total</span>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
             </div>
             <p className="text-2xl font-bold text-slate-900">{formatCurrency(grandTotal)}</p>
          </div>
          <div className="bg-[#003366] rounded-2xl p-6 shadow-lg shadow-blue-900/20 text-white">
             <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-blue-200 uppercase tracking-wider">Full Payment</span>
                <Calculator className="w-4 h-4 text-blue-200" />
             </div>
             <p className="text-2xl font-bold">{formatCurrency(grandTotal * 0.95)}</p>
             <p className="text-[10px] text-blue-300 font-bold mt-1">Includes 5% Prompt-Payment Discount</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Visual Analytics */}
           <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <PieChartIcon className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900">Cost Distribution</h3>
              </div>
              <div className="flex-1 min-h-[250px] relative">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie
                          data={chartData}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                       >
                          {chartData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                       </Pie>
                       <Tooltip 
                         contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                         formatter={(value: number) => formatCurrency(value)}
                       />
                    </PieChart>
                 </ResponsiveContainer>
                 {/* Center Label */}
                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Total</span>
                    <span className="text-lg font-bold text-slate-900">{formatCurrency(grandTotal)}</span>
                 </div>
              </div>
              <div className="mt-4 space-y-2">
                 {chartData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                       <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-slate-500 font-medium">{item.name}</span>
                       </div>
                       <span className="font-bold text-slate-700">{formatCurrency(item.value)}</span>
                    </div>
                 ))}
              </div>
           </div>

           {/* Detailed Table */}
           <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
              <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-slate-900">Course Fees Breakdown</h3>
                 </div>
                 <span className="text-xs font-bold px-2 py-1 bg-blue-50 text-blue-600 rounded-lg">
                    {semesterCourses.length} Courses
                 </span>
              </div>
              <div className="flex-1 overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="bg-slate-50/50">
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Course</th>
                          <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Credits</th>
                          <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tuition</th>
                          <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lab Fee</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {semesterCourses.map((course) => (
                          <tr key={course.code} className="hover:bg-slate-50/30 transition-colors group">
                             <td className="px-6 py-4">
                                <p className="text-sm font-bold text-slate-800 group-hover:text-blue-900">{course.code}</p>
                                <p className="text-[10px] font-medium text-slate-400 truncate max-w-[200px]">{course.name}</p>
                             </td>
                             <td className="px-6 py-4 text-center text-sm font-semibold text-slate-600">{course.credits}</td>
                             <td className="px-6 py-4 text-right text-sm font-semibold text-slate-700">{formatCurrency(course.tuitionCost)}</td>
                             <td className="px-6 py-4 text-right">
                                {course.labFee ? (
                                   <span className="text-xs font-bold text-amber-600">{formatCurrency(course.labFee)}</span>
                                ) : (
                                   <span className="text-xs text-slate-300">—</span>
                                )}
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
              <div className="p-6 bg-slate-50/50 border-t border-slate-100">
                 <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                       <strong>Note:</strong> Estimates based on USC 2024 Bulletin. Lab fees vary by department. 
                       Official clearance requires Bursar confirmation.
                    </p>
                 </div>
              </div>
           </div>
        </div>

        {/* Payment Options (Alternative Design) */}
        <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-blue-500/20 transition-all duration-1000"></div>
           <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              <div>
                 <h3 className="text-xl font-bold mb-2">Flexible Payment Plans</h3>
                 <p className="text-sm text-slate-400 font-medium leading-relaxed">Choose a structured installment plan that fits your budget.</p>
              </div>
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-5 transition-all cursor-pointer">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Installments (4x)</span>
                    <p className="text-xl font-bold mt-1">{formatCurrency(grandTotal / 4)}<span className="text-xs font-normal text-slate-400">/mo</span></p>
                    <div className="flex items-center gap-2 mt-3">
                       <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full w-1/4 bg-blue-500"></div>
                       </div>
                       <span className="text-[10px] font-bold">25% Start</span>
                    </div>
                 </div>
                 <div className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-5 transition-all cursor-pointer">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Deferred (GATE)</span>
                    <p className="text-xl font-bold mt-1">{formatCurrency(grandTotal * 0.2)}<span className="text-xs font-normal text-slate-400"> (Fees Only)</span></p>
                    <p className="text-[10px] text-slate-500 font-bold mt-3">Subject to GATE approval & status</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
