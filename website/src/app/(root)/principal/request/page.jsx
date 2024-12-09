"use client"
import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { School, LayoutDashboard, Clock, CheckCircle, MoveRight } from 'lucide-react';
import ResourceForm from '@/app/RequestComponent/ResourceForm';
import ResourceList from '@/app/RequestComponent/ResourceList';

function Page() {
  const [resources, setResources] = useState([]);

  useEffect(() => {
    console.log("API called from main page")
    const udise_code = sessionStorage.getItem("udiseId")
    const fetchresources = async () => {
      try {
        const response = await fetch(`/api/resource-request/principal/get-resources?udise_code=${udise_code}`)
        if (!response.ok) {
          console.error("Failed to fetch resources:", response.statusText);
          return;
        }
        const data = await response.json()

        console.log("logging all resource data from useEffect GET call", data)

        setResources(data)
      } catch (error) {
        console.error("Error fetching resources:", error);
      }
    }

    fetchresources()
  }, [])

  const handleRequestCreated = (newResource) => {
    setResources((prev) => [newResource, ...prev]);
  };

  const handleResourceUpdate = (updatedResource) => {
    setResources((prev) =>
      prev.map((resource) =>
        resource.id === updatedResource.id ? updatedResource : resource
      )
    );
  };

  // Memoize the status counts calculation
  const statusCounts = useMemo(() => {
    return resources.reduce(
      (acc, resource) => ({
        ...acc,
        [resource.status]: (acc[resource.status] || 0) + 1,
      }),
      { pending: 0, moved: 0, allocated: 0 }
    );
  }, [resources]);  // Recalculate only if 'resources' changes


  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <School className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Principal's Dashboard
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <LayoutDashboard className="h-5 w-5 text-gray-500" />
              <span className="text-sm text-gray-600">Resource Management</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="stats-card bg-amber-50 border-amber-200">
            <Clock className="h-8 w-8 text-amber-500" />
            <div className="ml-4">
              <h3 className="text-amber-700">Pending</h3>
              <p className="text-2xl font-bold text-amber-900">{statusCounts.pending}</p>
            </div>
          </div>
          <div className="stats-card bg-purple-50 border-purple-200">
            <MoveRight className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <h3 className="text-purple-700">In Progress</h3>
              <p className="text-2xl font-bold text-purple-900">{statusCounts.moved}</p>
            </div>
          </div>
          <div className="stats-card bg-emerald-50 border-emerald-200">
            <CheckCircle className="h-8 w-8 text-emerald-500" />
            <div className="ml-4">
              <h3 className="text-emerald-700">Allocated</h3>
              <p className="text-2xl font-bold text-emerald-900">{statusCounts.allocated}</p>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <ResourceForm onRequestCreated={handleRequestCreated} />
          </div>
          <div className="lg:col-span-2">
            <div className="card">
              <h2 className="text-2xl font-semibold mb-6 pb-4 border-b border-gray-100">
                Resource Requests
              </h2>
              <ResourceList
                resources={resources}
                onResourceUpdate={handleResourceUpdate}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Page;