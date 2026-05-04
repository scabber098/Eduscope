// === FILE: client/src/pages/student/StudentDashboard.jsx ===
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { ReportAPI, ResponseAPI } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/StatCard';
import { SkeletonCard } from '../../components/Skeleton';
import { timeAgo } from '../../utils/format';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [history, setHistory] = useState(null);
  useEffect(() => { Promise.all([ReportAPI.studentDashboard(),ResponseAPI.me()]).then(([d,h])=>{setData(d);setHistory(h);}).catch(()=>{setData({});setHistory([]);}); }, []);

  if (!data||!history) return <div className="grid gap-5"><div className="grid md:grid-cols-4 gap-5"><SkeletonCard/><SkeletonCard/><SkeletonCard/><SkeletonCard/></div><SkeletonCard/></div>;

  const p = data.participation_rate||0;
  const donut = [{name:'Answered',value:p,color:'#F0B429'},{name:'Missed',value:100-p,color:'rgba(240,234,214,0.04)'}];
  const perf = (data.performance||[]).map((x,i)=>({idx:i+1,score:x.correct?100:0}));

  return (
    <div className="grid gap-6">
      <motion.div initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }}>
        <h2 className="font-display text-3xl md:text-4xl font-bold" style={{ color:'#F0EAD6' }}>Welcome back, <span className="gold-text italic">{user?.name?.split(' ')[0]}</span></h2>
      </motion.div>
      <div className="grid md:grid-cols-4 gap-5">
        <StatCard label="Participation" value={p} suffix="%" accent="#F0B429" delay={0}/>
        <StatCard label="Polls answered" value={data.total_answered||0} accent="#F0EAD6" delay={0.1}/>
        <StatCard label="Accuracy" value={data.accuracy||0} suffix="%" accent="#3FB950" delay={0.2}/>
        <StatCard label="Streak" value={data.streak||0} accent="#E07B39" delay={0.3} icon={<span className="text-base">🔥</span>}/>
      </div>
      {data.streak>0&&<motion.div initial={{ opacity:0,scale:0.96 }} animate={{ opacity:1,scale:1 }} transition={{ delay:0.4 }}
        className="glass p-5 flex items-center gap-4" style={{ borderLeftWidth:4,borderLeftColor:'#E07B39' }}>
        <div className="text-3xl">🔥</div><div><div className="font-display text-xl" style={{ color:'#F0EAD6' }}>{data.streak} lectures in a row!</div><div className="text-sm" style={{ color:'#8B949E' }}>Keep the streak alive.</div></div>
      </motion.div>}
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.25 }} className="glass p-6">
          <h3 className="font-display text-xl mb-4" style={{ color:'#F0EAD6' }}>Participation</h3>
          <div className="flex items-center gap-8">
            <div className="w-44 h-44 relative"><ResponsiveContainer><PieChart><Pie data={donut} innerRadius={55} outerRadius={80} startAngle={90} endAngle={-270} dataKey="value" isAnimationActive animationDuration={1100} stroke="none">{donut.map((d,i)=><Cell key={i} fill={d.color}/>)}</Pie></PieChart></ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"><div className="font-display text-3xl font-bold" style={{ color:'#F0EAD6' }}>{p}%</div><div className="text-xs uppercase tracking-wider mt-1" style={{ color:'#8B949E' }}>Engaged</div></div></div>
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between text-sm"><span className="flex items-center gap-2" style={{ color:'#F0EAD6' }}><span className="w-3 h-3 rounded-full" style={{ background:'#F0B429' }}/>Answered</span><span style={{ color:'#8B949E' }}>{data.total_answered}</span></div>
              <div className="flex items-center justify-between text-sm"><span className="flex items-center gap-2" style={{ color:'#8B949E' }}><span className="w-3 h-3 rounded-full" style={{ background:'rgba(240,234,214,0.04)' }}/>Missed</span><span style={{ color:'#8B949E' }}>{Math.max(0,(data.total_polls||0)-(data.total_answered||0))}</span></div>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.35 }} className="glass p-6">
          <h3 className="font-display text-xl mb-4" style={{ color:'#F0EAD6' }}>Performance</h3>
          {perf.length===0?<div className="h-48 flex items-center justify-center text-sm" style={{ color:'#4a5060' }}>Answer polls to see your trend.</div>:(
            <div className="h-48"><ResponsiveContainer><LineChart data={perf}><CartesianGrid stroke="rgba(240,234,214,0.04)" vertical={false}/><XAxis dataKey="idx" stroke="#8B949E" tick={{ fontSize:11 }}/><YAxis stroke="#8B949E" tick={{ fontSize:11 }} domain={[0,100]}/>
              <Tooltip contentStyle={{ background:'rgba(22,27,34,0.95)',border:'1px solid rgba(240,234,214,0.06)',borderRadius:12,color:'#F0EAD6' }}/>
              <Line type="monotone" dataKey="score" stroke="#F0B429" strokeWidth={2.5} dot={{ fill:'#F0B429',r:4 }} isAnimationActive animationDuration={1200}/></LineChart></ResponsiveContainer></div>
          )}
        </motion.div>
      </div>
      <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.45 }} className="glass p-6">
        <h3 className="font-display text-xl mb-5" style={{ color:'#F0EAD6' }}>Recent activity</h3>
        {history.length===0?<div className="text-sm" style={{ color:'#4a5060' }}>No activity yet.</div>:(
          <div className="space-y-3">{history.slice(0,5).map((r,i)=>(
            <motion.div key={r.response_id} initial={{ opacity:0,x:-10 }} animate={{ opacity:1,x:0 }} transition={{ delay:0.5+i*0.06 }}
              className="flex items-center gap-4 py-2 border-b last:border-0" style={{ borderColor:'rgba(240,234,214,0.03)' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm flex-shrink-0" style={{
                background:r.correct===true?'rgba(63,185,80,0.12)':r.correct===false?'rgba(248,81,73,0.12)':'rgba(240,180,41,0.08)',
                color:r.correct===true?'#3FB950':r.correct===false?'#F85149':'#F0B429' }}>{r.correct===true?'✓':r.correct===false?'✕':'·'}</div>
              <div className="flex-1 min-w-0"><div className="text-sm truncate" style={{ color:'#F0EAD6' }}>{r.question}</div><div className="text-xs" style={{ color:'#4a5060' }}>{r.lecture_name} · {timeAgo(r.created_at)}</div></div>
            </motion.div>
          ))}</div>
        )}
      </motion.div>
    </div>
  );
}
