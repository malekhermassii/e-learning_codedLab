import React, { useState } from 'react';

const AnalyticsPage = () => {
  // Sample data for the analytics page
  const courseData = [
    { 
      id: 1, 
      title: 'React Fundamentals',
      studentsEnrolled: 278,
      completionRate: 65,
      averageRating: 4.7,
      avgCompletionDays: 18,
      revenue: 13900,
      activeStudents: 215,
      revenueLastMonth: 2800,
      studentsLastMonth: 45
    },
    { 
      id: 2, 
      title: 'Advanced JavaScript',
      studentsEnrolled: 156,
      completionRate: 48,
      averageRating: 4.5,
      avgCompletionDays: 24,
      revenue: 7800,
      activeStudents: 104,
      revenueLastMonth: 1500,
      studentsLastMonth: 28
    },
    { 
      id: 3, 
      title: 'Python for Beginners',
      studentsEnrolled: 342,
      completionRate: 72,
      averageRating: 4.8,
      avgCompletionDays: 15,
      revenue: 17100,
      activeStudents: 290,
      revenueLastMonth: 3400,
      studentsLastMonth: 62
    }
  ];
  
  // Total platform metrics
  const totalMetrics = {
    totalStudents: courseData.reduce((sum, course) => sum + course.studentsEnrolled, 0),
    totalRevenue: courseData.reduce((sum, course) => sum + course.revenue, 0),
    averageCompletionRate: Math.round(
      courseData.reduce((sum, course) => sum + course.completionRate, 0) / courseData.length
    ),
    averageRating: (
      courseData.reduce((sum, course) => sum + course.averageRating, 0) / courseData.length
    ).toFixed(1),
    studentsLastMonth: courseData.reduce((sum, course) => sum + course.studentsLastMonth, 0),
    revenueLastMonth: courseData.reduce((sum, course) => sum + course.revenueLastMonth, 0)
  };

  // Sample engagement data for charts
  const engagementData = {
    weekly: [
      { period: 'Week 1', students: 125, completions: 22, discussions: 45 },
      { period: 'Week 2', students: 150, completions: 34, discussions: 56 },
      { period: 'Week 3', students: 142, completions: 30, discussions: 42 },
      { period: 'Week 4', students: 168, completions: 38, discussions: 61 },
      { period: 'Week 5', students: 155, completions: 36, discussions: 50 },
      { period: 'Week 6', students: 172, completions: 40, discussions: 65 },
      { period: 'Week 7', students: 190, completions: 45, discussions: 72 },
      { period: 'Week 8', students: 205, completions: 50, discussions: 80 }
    ]
  };

  // Student retention data for the retention chart
  const retentionData = [
    { module: 'Module 1', startedCount: 776, completedCount: 750 },
    { module: 'Module 2', startedCount: 745, completedCount: 710 },
    { module: 'Module 3', startedCount: 705, completedCount: 650 },
    { module: 'Module 4', startedCount: 645, completedCount: 595 },
    { module: 'Module 5', startedCount: 590, completedCount: 530 },
    { module: 'Module 6', startedCount: 525, completedCount: 480 },
    { module: 'Module 7', startedCount: 475, completedCount: 430 },
    { module: 'Module 8', startedCount: 425, completedCount: 375 }
  ];

  // State for time range filter
  const [timeRange, setTimeRange] = useState('30days');
  const [selectedCourse, setSelectedCourse] = useState('all');

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics </h1>
        <p className="text-gray-600">Track your course performance and student engagement</p>
      </div>
      
      {/* Filter Controls */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
          >
            <option value="all">All Courses</option>
            {courseData.map(course => (
              <option key={course.id} value={course.id.toString()}>{course.title}</option>
            ))}
          </select>
        </div>
        
       
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Students</p>
              <div className="flex items-baseline">
                <p className="text-2xl font-bold text-gray-900 mr-2">{totalMetrics.totalStudents}</p>
                <p className="text-sm text-green-600">
                  <span className="font-medium">+{totalMetrics.studentsLastMonth}</span> this month
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
              <div className="flex items-baseline">
                <p className="text-2xl font-bold text-gray-900 mr-2">{formatCurrency(totalMetrics.totalRevenue)}</p>
                <p className="text-sm text-green-600">
                  <span className="font-medium">+{formatCurrency(totalMetrics.revenueLastMonth)}</span> this month
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Completion Rate</p>
              <div className="flex items-baseline">
                <p className="text-2xl font-bold text-gray-900">{totalMetrics.averageCompletionRate}%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Average Rating</p>
              <div className="flex items-baseline">
                <p className="text-2xl font-bold text-gray-900">{totalMetrics.averageRating}</p>
                <p className="ml-1 text-gray-500">/5</p>
              </div>
            </div>
          </div>
        </div>
      </div>

  

      {/* Course performance table */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Course Performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Students
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completion Rate
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg. Rating
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg. Completion Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {courseData.map((course) => (
                <tr key={course.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {course.title}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {course.studentsEnrolled}
                    <span className="text-xs text-green-600 ml-2">+{course.studentsLastMonth}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2 max-w-[100px]">
                        <div 
                          className={`h-2.5 rounded-full ${
                            course.completionRate < 50 ? 'bg-yellow-500' : 
                            course.completionRate < 70 ? 'bg-blue-500' : 
                            'bg-green-500'
                          }`} 
                          style={{ width: `${course.completionRate}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-500">{course.completionRate}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg 
                          key={star}
                          className={`h-4 w-4 ${star <= Math.round(course.averageRating) ? 'text-yellow-400' : 'text-gray-300'}`}
                          xmlns="http://www.w3.org/2000/svg" 
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      <span className="ml-2">{course.averageRating}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {course.avgCompletionDays} days
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {formatCurrency(course.revenue)}
                    <span className="text-xs text-green-600 ml-2">+{formatCurrency(course.revenueLastMonth)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage; 