import { useState, useEffect } from 'react';
import {
    PieChart, Pie, Cell, ResponsiveContainer,
    BarChart, Bar, XAxis, Tooltip
} from 'recharts';
import { Check, Flame, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';

const COLORS = ['var(--accent-color)', 'var(--gray-200)'];

export default function TodayDashboard({ session }: { session: any }) {
    const [tasks, setTasks] = useState<any[]>([]);
    const [stats, setStats] = useState({ completed: 0, total: 0 });
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (session?.user?.id) fetchTasks();
    }, [session]);

    const fetchTasks = async () => {
        try {
            setLoading(true);


            // Get user's today's tasks
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('owner_id', session.user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // For MVP, just filter the fetched tasks for what belongs here
            // or simply show all for demonstration if empty
            if (data) {
                setTasks(data);
                const complete = data.filter(t => t.is_completed).length;
                setStats({ completed: complete, total: data.length });
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleTask = async (task: any) => {
        const newStatus = !task.is_completed;
        const completeDate = newStatus ? new Date().toISOString() : null;

        // Optimistic update
        setTasks(tasks.map(t =>
            t.id === task.id ? { ...t, is_completed: newStatus, completed_at: completeDate } : t
        ));
        setStats(prev => ({
            ...prev,
            completed: newStatus ? prev.completed + 1 : prev.completed - 1
        }));

        const { error } = await supabase
            .from('tasks')
            .update({ is_completed: newStatus, completed_at: completeDate })
            .eq('id', task.id);

        if (error) {
            console.error('Error updating task:', error);
            fetchTasks(); // Revert on error
        }
    };

    const addTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;

        const newTask = {
            title: newTaskTitle,
            owner_id: session.user.id,
            is_completed: false,
        };

        const { data, error } = await supabase
            .from('tasks')
            .insert([newTask])
            .select();

        if (error) {
            console.error('Error inserting task:', error);
            return;
        }

        if (data) {
            setTasks([data[0], ...tasks]);
            setStats(prev => ({ ...prev, total: prev.total + 1 }));
            setNewTaskTitle('');
        }
    };

    const mockDailyProgress = [
        { name: 'Completed', value: stats.completed || 0 },
        { name: 'Remaining', value: Math.max((stats.total - stats.completed), 0) }
    ];

    const mockWeeklyStats = [
        { day: 'M', count: 5 }, { day: 'T', count: 8 },
        { day: 'W', count: 12 }, { day: 'T', count: 7 },
        { day: 'F', count: stats.completed || 0 }, { day: 'S', count: 0 }, { day: 'S', count: 0 },
    ];

    const percentComplete = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

    return (
        <div>
            <header className="dashboard-header">
                <h1 className="dashboard-title">Today</h1>
                <p className="dashboard-subtitle">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} • You have {stats.total - stats.completed} tasks remaining</p>
            </header>

            {/* Progress & Visual Section */}
            <section className="stats-grid">
                {/* Daily Ring Chart */}
                <div className="stat-card">
                    <span className="stat-label">Daily Progress</span>
                    <div className="chart-container" style={{ height: '140px', marginTop: '10px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={mockDailyProgress}
                                    innerRadius={50}
                                    outerRadius={65}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                    startAngle={90}
                                    endAngle={-270}
                                >
                                    {mockDailyProgress.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeLinecap="round" />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {percentComplete}% Completed
                    </p>
                </div>

                {/* Weekly Bar Chart */}
                <div className="stat-card">
                    <span className="stat-label">Weekly Velocity</span>
                    <div className="chart-container" style={{ height: '150px', marginLeft: '-20px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={mockWeeklyStats} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                                <Tooltip cursor={{ fill: 'var(--accent-light)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                                <Bar dataKey="count" fill="var(--accent-color)" radius={[4, 4, 4, 4]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Streak Counter */}
                <div className="stat-card" style={{ background: 'var(--streak-bg)', borderColor: 'var(--streak-border)' }}>
                    <Flame size={48} color="#d946ef" style={{ marginBottom: '10px' }} strokeWidth={1.5} />
                    <h2 className="stat-value" style={{ color: '#c026d3', margin: 0 }}>14 Days</h2>
                    <span className="stat-label" style={{ color: '#a21caf' }}>Productivity Streak</span>
                </div>
            </section>

            {/* Interactive Task List */}
            <section>
                <div className="task-list-header">
                    <h2 className="task-list-title">My Tasks</h2>
                </div>

                <form onSubmit={addTask} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <input
                        type="text"
                        placeholder="Add a new task for today..."
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        style={{ flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                    />
                    <button type="submit" disabled={!newTaskTitle.trim()} style={{ backgroundColor: 'var(--accent-color)', color: 'white', padding: '0 1.5rem', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
                        <Plus size={18} /> Add Task
                    </button>
                </form>

                {loading ? (
                    <p style={{ color: 'var(--text-secondary)' }}>Loading tasks from Supabase...</p>
                ) : tasks.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
                        <Check size={48} color="var(--border-color)" style={{ margin: '0 auto 1rem auto' }} />
                        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>All caught up!</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>You have no tasks remaining today.</p>
                    </div>
                ) : (
                    <div className="task-list">
                        {tasks.map(task => (
                            <div
                                key={task.id}
                                className={`task-item ${task.is_completed ? 'completed' : ''}`}
                            >
                                <div
                                    className="task-checkbox"
                                    onClick={() => toggleTask(task)}
                                >
                                    {task.is_completed && <Check size={14} strokeWidth={3} />}
                                </div>

                                <div className="task-content">
                                    <h3 className="task-title">{task.title}</h3>
                                    <div className="task-meta">
                                        <span style={{ color: 'var(--text-secondary)' }}>{new Date(task.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        {task.project_id && (
                                            <>
                                                <span style={{ color: 'var(--text-secondary)' }}>•</span>
                                                <span className="badge blue">Project Task</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
