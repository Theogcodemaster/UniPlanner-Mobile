import { useState } from 'react';
import { DollarSign, Download, Calculator, AlertCircle, TrendingUp, CreditCard, Wallet, BookOpen, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

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
    { name: 'Tuition', value: tuitionSubtotal, color: '#006633' },
    { name: 'Lab Fees', value: '#FDB515', color: '#FDB515' },
    { name: 'General Fees', value: generalFeesTotal, color: '#10b981' },
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
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Wallet className="w-5 h-5" />
               </div>
               <h2 className="text-3xl font-black text-zinc-900 tracking-tight font-serif">Bursar Portal</h2>
            </div>
            <p className="text-sm font-medium text-zinc-500 mt-1 max-w-2xl leading-relaxed">Real-time cost breakdown and automated payment forecasting.</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="px-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none shadow-sm transition-all custom-scrollbar"
            >
              <option>Fall 2024</option>
              <option>Spring 2025</option>
            </select>
            <button className="flex items-center gap-2 px-6 py-2.5 bg-zinc-900 text-white rounded-xl shadow-lg shadow-zinc-900/10 hover:bg-zinc-800 transition-all font-bold text-sm squishy-button">
              <Download className="w-4 h-4" /> Export PDF
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 pb-8 space-y-6 custom-scrollbar">
        {/* Top Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="premium-card p-6">
             <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Tuition</span>
                <DollarSign className="w-4 h-4 text-primary" />
             </div>
             <p className="text-2xl font-black text-zinc-900 font-serif">{formatCurrency(tuitionSubtotal)}</p>
          </div>
          <div className="premium-card p-6">
             <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Fees</span>
                <CreditCard className="w-4 h-4 text-secondary" />
             </div>
             <p className="text-2xl font-black text-zinc-900 font-serif">{formatCurrency(generalFeesTotal + labFeesSubtotal)}</p>
          </div>
          <div className="premium-card p-6">
             <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Grand Total</span>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
             </div>
             <p className="text-2xl font-black text-zinc-900 font-serif">{formatCurrency(grandTotal)}</p>
          </div>
          <div className="bg-primary rounded-[2rem] p-6 shadow-xl shadow-primary/20 text-white relative overflow-hidden group">
             <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px] opacity-[0.05] pointer-events-none"></div>
             <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                   <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Full Payment</span>
                   <Calculator className="w-4 h-4 text-secondary" />
                </div>
                <p className="text-2xl font-black font-serif">{formatCurrency(grandTotal * 0.95)}</p>
                <p className="text-[10px] text-white/60 font-bold mt-1 uppercase tracking-wider italic">5% Discount Applied</p>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Visual Analytics */}
           <div className="lg:col-span-1 premium-card p-6 flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <PieChartIcon className="w-5 h-5 text-primary" />
                <h3 className="font-black text-zinc-900 font-serif text-lg">Cost Distribution</h3>
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
                             <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                          ))}
                       </Pie>
                       <Tooltip 
                         contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                         formatter={(value: number) => formatCurrency(value)}
                       />
                    </PieChart>
                 </ResponsiveContainer>
                 {/* Center Label */}
                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Total</span>
                    <span className="text-xl font-black text-zinc-900 font-serif">{formatCurrency(grandTotal)}</span>
                 </div>
              </div>
              <div className="mt-4 space-y-3">
                 {chartData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                       <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">{item.name}</span>
                       </div>
                       <span className="font-black text-zinc-900 font-serif">{formatCurrency(item.value)}</span>
                    </div>
                 ))}
              </div>
           </div>

           {/* Detailed Table */}
           <div className="lg:col-span-2 premium-card overflow-hidden flex flex-col">
              <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    <h3 className="font-black text-zinc-900 font-serif text-lg">Fee Breakdown</h3>
                 </div>
                 <span className="text-[10px] font-black px-2.5 py-1 bg-primary/5 text-primary rounded-lg border border-primary/10 uppercase tracking-widest">
                    {semesterCourses.length} Courses
                 </span>
              </div>
              <div className="flex-1 overflow-x-auto custom-scrollbar">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="bg-zinc-50/50 border-b border-zinc-100">
                          <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Course Code</th>
                          <th className="px-6 py-4 text-center text-[10px] font-black text-zinc-400 uppercase tracking-widest">Credits</th>
                          <th className="px-6 py-4 text-right text-[10px] font-black text-zinc-400 uppercase tracking-widest">Tuition</th>
                          <th className="px-6 py-4 text-right text-[10px] font-black text-zinc-400 uppercase tracking-widest">Lab Fee</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                       {semesterCourses.map((course) => (
                          <tr key={course.code} className="hover:bg-zinc-50/30 transition-colors group">
                             <td className="px-6 py-4">
                                <p className="text-sm font-black text-zinc-800 group-hover:text-primary transition-colors font-serif">{course.code}</p>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider truncate max-w-[200px] mt-0.5">{course.name}</p>
                             </td>
                             <td className="px-6 py-4 text-center text-sm font-bold text-zinc-600">{course.credits}</td>
                             <td className="px-6 py-4 text-right text-sm font-bold text-zinc-700 font-serif">{formatCurrency(course.tuitionCost)}</td>
                             <td className="px-6 py-4 text-right">
                                {course.labFee ? (
                                   <span className="text-xs font-black text-secondary font-serif">{formatCurrency(course.labFee)}</span>
                                ) : (
                                   <span className="text-[10px] font-black text-zinc-200 uppercase tracking-widest">N/A</span>
                                )}
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
              <div className="p-6 bg-zinc-50/50 border-t border-zinc-100">
                 <div className="flex items-start gap-4">
                    <div className="p-2 bg-secondary/10 rounded-xl">
                       <AlertCircle className="w-4 h-4 text-secondary" />
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">
                       <strong className="text-zinc-700 uppercase tracking-widest text-[9px] block mb-1">Institutional Note</strong>
                       Estimates are based on the USC 2024 Bulletin. Lab fees vary by department. 
                       Official clearance requires Bursar confirmation via the main campus finance office.
                    </p>
                 </div>
              </div>
           </div>
        </div>

        {/* Payment Options */}
        <div className="bg-zinc-900 rounded-[2rem] p-8 text-white relative overflow-hidden group shadow-2xl shadow-zinc-900/20">
           <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none"></div>
           <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-primary/30 transition-all duration-1000"></div>
           <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              <div>
                 <h3 className="text-2xl font-black mb-2 font-serif tracking-tight">Payment Strategy</h3>
                 <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest leading-relaxed">Choose a structured installment plan for financial sustainability.</p>
              </div>
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-3xl p-6 transition-all cursor-pointer group/card squishy-button">
                    <span className="text-[10px] font-black text-secondary uppercase tracking-[0.3em]">Installment Plan</span>
                    <p className="text-2xl font-black mt-2 font-serif">{formatCurrency(grandTotal / 4)}<span className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">/mo</span></p>
                    <div className="flex items-center gap-3 mt-4">
                       <div className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full w-1/4 bg-secondary shadow-[0_0_8px_rgba(253,181,21,0.5)]"></div>
                       </div>
                       <span className="text-[10px] font-black uppercase tracking-widest">4 Payments</span>
                    </div>
                 </div>
                 <div className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-3xl p-6 transition-all cursor-pointer group/card squishy-button">
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em]">GATE Deferred</span>
                    <p className="text-2xl font-black mt-2 font-serif">{formatCurrency(grandTotal * 0.2)}<span className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1"> (Fees Only)</span></p>
                    <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mt-4">Subject to Ministry Approval</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
