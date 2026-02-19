import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const API_URL = 'http://localhost:3000/api';

export default function AdminAnalytics() {
    const [summary, setSummary] = useState(null);
    const [statusBreakdown, setStatusBreakdown] = useState([]);
    const [monthlyVolume, setMonthlyVolume] = useState([]);
    const [topGrades, setTopGrades] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const [summaryRes, statusRes, monthlyRes, gradesRes] = await Promise.all([
                axios.get(`${API_URL}/analytics/summary`),
                axios.get(`${API_URL}/analytics/status-breakdown`),
                axios.get(`${API_URL}/analytics/monthly-volume`),
                axios.get(`${API_URL}/analytics/top-grades`)
            ]);

            setSummary(summaryRes.data);
            setStatusBreakdown(statusRes.data);
            setMonthlyVolume(monthlyRes.data);
            setTopGrades(gradesRes.data);
            setLoading(false);
        } catch (err) {
            console.error("Analytics fetch error:", err);
            setLoading(false);
        }
    };

    // Professional dark color palette
    const chartColors = {
        primary: 'rgba(99, 102, 241, 0.85)',      // Indigo
        secondary: 'rgba(139, 92, 246, 0.85)',    // Purple
        success: 'rgba(16, 185, 129, 0.85)',      // Emerald
        warning: 'rgba(251, 146, 60, 0.85)',      // Orange
        info: 'rgba(14, 165, 233, 0.85)',         // Sky
        danger: 'rgba(239, 68, 68, 0.85)',        // Red
    };

    // Chart configurations
    const statusChartData = {
        labels: statusBreakdown.map(s => s.status || 'Unknown'),
        datasets: [{
            label: 'Shipments',
            data: statusBreakdown.map(s => s.count),
            backgroundColor: [
                chartColors.success,
                chartColors.info,
                chartColors.warning,
                chartColors.danger,
            ],
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 2,
            hoverBorderColor: 'rgba(255, 255, 255, 0.3)',
            hoverBorderWidth: 3
        }]
    };

    const monthlyChartData = {
        labels: monthlyVolume.map(m => m.month),
        datasets: [{
            label: 'Shipments',
            data: monthlyVolume.map(m => m.count),
            backgroundColor: 'rgba(99, 102, 241, 0.8)',
            borderColor: 'rgb(99, 102, 241)',
            borderWidth: 2,
            borderRadius: 6,
            hoverBackgroundColor: 'rgba(139, 92, 246, 0.9)'
        }]
    };

    const gradesChartData = {
        labels: topGrades.map(g => g.grade),
        datasets: [{
            label: 'Frequency',
            data: topGrades.map(g => g.count),
            backgroundColor: 'rgba(16, 185, 129, 0.8)',
            borderColor: 'rgb(16, 185, 129)',
            borderWidth: 2,
            borderRadius: 6,
            hoverBackgroundColor: 'rgba(14, 165, 233, 0.9)'
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: '#94a3b8',
                    font: {
                        size: 11,
                        family: "'Inter', sans-serif"
                    },
                    padding: 12,
                    usePointStyle: true
                }
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                titleColor: '#f1f5f9',
                bodyColor: '#cbd5e1',
                borderColor: 'rgba(148, 163, 184, 0.2)',
                borderWidth: 1,
                padding: 12,
                cornerRadius: 8
            }
        },
        scales: {
            y: {
                grid: {
                    color: 'rgba(148, 163, 184, 0.08)',
                    drawBorder: false
                },
                ticks: {
                    color: '#94a3b8',
                    font: { size: 11 }
                }
            },
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    color: '#94a3b8',
                    font: { size: 11 }
                }
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl">
                <div className="text-center">
                    <svg className="animate-spin h-10 w-10 mx-auto mb-3 text-indigo-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-slate-400 font-medium">Loading Analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                        <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">Analytics Dashboard</span>
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Real-time insights and performance metrics</p>
                </div>
                <button onClick={fetchAnalytics} className="bg-slate-800 text-slate-200 px-5 py-2.5 rounded-lg hover:bg-slate-700 transition text-sm font-medium border border-slate-700 shadow-sm">
                    <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </span>
                </button>
            </div>

            {/* Summary Cards - Dark Theme */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Total Shipments - Indigo */}
                <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700 shadow-lg hover:shadow-xl transition-shadow group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
                    <div className="relative">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Shipments</span>
                            <div className="bg-indigo-500/20 p-2 rounded-lg">
                                <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-4xl font-bold text-white mb-1">{summary?.totalShipments || 0}</p>
                        <p className="text-xs text-slate-500">All time</p>
                    </div>
                </div>

                {/* Total Value - Purple */}
                <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700 shadow-lg hover:shadow-xl transition-shadow group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
                    <div className="relative">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Value</span>
                            <div className="bg-purple-500/20 p-2 rounded-lg">
                                <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-4xl font-bold text-white mb-1">${(summary?.totalValue || 0).toLocaleString()}</p>
                        <p className="text-xs text-slate-500">USD</p>
                    </div>
                </div>

                {/* Pending - Orange */}
                <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700 shadow-lg hover:shadow-xl transition-shadow group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
                    <div className="relative">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Pending Review</span>
                            <div className="bg-orange-500/20 p-2 rounded-lg">
                                <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-4xl font-bold text-white mb-1">{summary?.pendingInvoices || 0}</p>
                        <p className="text-xs text-slate-500">Requires action</p>
                    </div>
                </div>

                {/* Approved - Emerald */}
                <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700 shadow-lg hover:shadow-xl transition-shadow group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
                    <div className="relative">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Approved</span>
                            <div className="bg-emerald-500/20 p-2 rounded-lg">
                                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-4xl font-bold text-white mb-1">{summary?.approvedInvoices || 0}</p>
                        <p className="text-xs text-slate-500">Blockchain locked</p>
                    </div>
                </div>
            </div>

            {/* Charts Grid - Dark Theme */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Status Breakdown Pie Chart */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-200 flex items-center text-lg">
                            <div className="bg-indigo-500/20 p-2 rounded-lg mr-3">
                                <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                                </svg>
                            </div>
                            Shipment Status
                        </h3>
                        <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-1 rounded">Distribution</span>
                    </div>
                    <div className="h-64">
                        <Pie data={statusChartData} options={chartOptions} />
                    </div>
                </div>

                {/* Monthly Volume Bar Chart */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-200 flex items-center text-lg">
                            <div className="bg-purple-500/20 p-2 rounded-lg mr-3">
                                <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            Monthly Volume
                        </h3>
                        <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-1 rounded">Last 12 months</span>
                    </div>
                    <div className="h-64">
                        <Bar data={monthlyChartData} options={{...chartOptions, plugins: {...chartOptions.plugins, legend: {display: false}}}} />
                    </div>
                </div>

                {/* Top Tea Grades Bar Chart */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700 shadow-lg lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-200 flex items-center text-lg">
                            <div className="bg-emerald-500/20 p-2 rounded-lg mr-3">
                                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            Most Shipped Tea Grades
                        </h3>
                        <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-1 rounded">Top 5</span>
                    </div>
                    <div className="h-64">
                        <Bar data={gradesChartData} options={{...chartOptions, plugins: {...chartOptions.plugins, legend: {display: false}}}} />
                    </div>
                </div>
            </div>
        </div>
    );
}