// === FILE: client/src/pages/faculty/FacultyDashboard.jsx ===
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { ReportAPI } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/StatCard';
import { SkeletonCard } from '../../components/Skeleton';
import { formatDate } from '../../utils/format';
import AnalyticsSummaryPanel from '../../components/AnalyticsSummaryPanel';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  useEffect(() => { ReportAPI.facultyDashboard().then(setData).catch(() => setData({})); }, []);

  if (!data) return <div className="grid gap-5"><div className="grid md:grid-cols-4 gap-5"><SkeletonCard/><SkeletonCard/><SkeletonCard/><SkeletonCard/></div><SkeletonCard/></div>;

  const perLecture = data.participation_per_lecture || [];
  const topics = data.topics || [];

  return (
    <div className="grid gap-6">
      <motion.div initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }}>
        <h2 className="font-display text-3xl md:text-4xl font-bold" style={{ color:'#F0EAD6' }}>
          Good to see you, <span className="gold-text italic">{user?.name?.split(' ').slice(-1)[0]}</span>
        </h2>
        <p className="mt-1" style={{ color:'#8B949E' }}>Here's where your classes stand today.</p>
      </motion.div>

      <div className="grid md:grid-cols-4 gap-5">
        <StatCard label="Lectures" value={data.total_lectures||0} accent="#F0EAD6" delay={0}/>
        <StatCard label="Polls launched" value={data.total_polls||0} accent="#F0B429" delay={0.1}/>
        <StatCard label="Avg. participation" value={data.avg_participation||0} suffix="%" accent="#3FB950" delay={0.2}/>
        <motion.div initial={{ opacity:0,y:18 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.3 }} whileHover={{ y:-6 }} className="glass p-6">
          <div className="text-xs uppercase tracking-wider mb-3" style={{ color:'#8B949E' }}>Most struggled topic</div>
          {data.most_struggled_topic ? <>
            <div className="font-display text-2xl font-bold leading-tight" style={{ color:'#F85149' }}>{data.most_struggled_topic.tag}</div>
            <div className="text-sm mt-2" style={{ color:'#8B949E' }}>Only {data.most_struggled_topic.avg_correct}% correct</div>
          </> : <div className="font-display text-2xl italic" style={{ color:'#4a5060' }}>None yet</div>}
        </motion.div>
      </div>

      {/* NEW: Live student analytics summary */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}>
        <h3 className="font-display text-lg font-semibold mb-3" style={{ color: '#8B949E' }}>
          Live Student Analytics
        </h3>
        <AnalyticsSummaryPanel />
      </motion.div>

      <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.35 }} className="glass p-6">
        <h3 className="font-display text-xl mb-4" style={{ color:'#F0EAD6' }}>Participation per lecture</h3>
        {perLecture.length === 0 ? <div className="h-48 flex items-center justify-center text-sm" style={{ color:'#4a5060' }}>Launch your first poll to see data.</div> : (
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={perLecture} margin={{ top:10,right:10,left:-20,bottom:10 }}>
                <CartesianGrid stroke="rgba(240,234,214,0.04)" vertical={false}/>
                <XAxis dataKey="lecture" stroke="#8B949E" tick={{ fontSize:10 }} interval={0} angle={-15} textAnchor="end" height={70}/>
                <YAxis stroke="#8B949E" tick={{ fontSize:11 }} domain={[0,100]}/>
                <Tooltip cursor={{ fill:'rgba(240,180,41,0.06)' }} contentStyle={{ background:'rgba(22,27,34,0.95)',border:'1px solid rgba(240,234,214,0.06)',borderRadius:12,color:'#F0EAD6',backdropFilter:'blur(12px)' }} formatter={v=>[`${v}%`,'Participation']}/>
                <Bar dataKey="rate" radius={[6,6,0,0]} isAnimationActive animationDuration={1200}>
                  {perLecture.map((d,i) => <Cell key={i} fill={d.rate>=75?'#3FB950':d.rate>=50?'#F0B429':'#E07B39'}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.45 }} className="glass p-6">
          <h3 className="font-display text-xl mb-2" style={{ color:'#F0EAD6' }}>Topic difficulty</h3>
          <p className="text-xs mb-4" style={{ color:'#4a5060' }}>Red = below 60% correct</p>
          {topics.length === 0 ? <div className="text-sm" style={{ color:'#4a5060' }}>Not enough data.</div> : (
            <div className="space-y-2">{topics.slice(0,8).map((t,i) => (
              <motion.div key={t.tag} initial={{ opacity:0,x:-8 }} animate={{ opacity:1,x:0 }} transition={{ delay:0.5+i*0.05 }} className="flex items-center gap-3">
                <div className="flex-1 text-sm truncate" style={{ color:'#F0EAD6' }}>{t.tag}</div>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background:'rgba(240,234,214,0.04)' }}>
                  <motion.div initial={{ width:0 }} animate={{ width:`${t.avg_correct}%` }} transition={{ duration:1,delay:0.6+i*0.05 }}
                    className="h-full rounded-full" style={{ background:t.avg_correct<60?'#F85149':t.avg_correct<75?'#F0B429':'#3FB950' }}/>
                </div>
                <div className={`w-12 text-right text-sm font-mono`} style={{ color:t.avg_correct<60?'#F85149':'#8B949E' }}>{t.avg_correct}%</div>
              </motion.div>
            ))}</div>
          )}
        </motion.div>

        <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.55 }} className="glass p-6">
          <h3 className="font-display text-xl mb-4" style={{ color:'#F0EAD6' }}>Recent lectures</h3>
          {(data.recent_lectures||[]).length === 0 ? <div className="text-sm" style={{ color:'#4a5060' }}>No lectures yet.</div> : (
            <div className="space-y-2">{data.recent_lectures.map((l,i) => (
              <motion.div key={l.id} initial={{ opacity:0,x:-8 }} animate={{ opacity:1,x:0 }} transition={{ delay:0.6+i*0.05 }}
                className="flex items-center justify-between p-3 rounded-xl border transition-colors hover:border-[rgba(240,180,41,0.2)]"
                style={{ borderColor:'rgba(240,234,214,0.06)' }}>
                <div><div className="font-medium" style={{ color:'#F0EAD6' }}>{l.name}</div><div className="text-xs" style={{ color:'#4a5060' }}>{formatDate(l.created_at)}</div></div>
              </motion.div>
            ))}</div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
