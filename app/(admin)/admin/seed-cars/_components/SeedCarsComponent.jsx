'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { seedIndianCars } from '@/actions/seed-indian-cars'

const SeedCarsComponent = () => {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleSeedCars = async () => {
    try {
      setLoading(true)
      setError(null)
      setResult(null)

      const response = await seedIndianCars()

      if (response.success) {
        setResult(response)
      } else {
        setError(response.error)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Add 10 Indian Brand Cars</h2>
          <p className="text-gray-600 mb-4">
            Click the button below to add 10 popular Indian brand cars to your inventory, including:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
            <li>Suzuki Swift - Compact Hatchback</li>
            <li>Maruti Desire - Sedan</li>
            <li>Tata Nexon - Compact SUV</li>
            <li>Tata Punch - Budget SUV</li>
            <li>Tata Harrier - Premium SUV</li>
            <li>Hyundai Creta - Compact SUV</li>
            <li>Toyota Fortuner - 7-seater SUV</li>
            <li>Kia Seltos - Compact SUV</li>
            <li>Mahindra XUV700 - Premium 7-seater SUV</li>
            <li>Skoda Slavia - Premium Sedan</li>
          </ul>
          <p className="text-sm text-gray-500 italic">
            ℹ️ All cars use Unsplash images and have realistic Indian market pricing.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">{result.message}</AlertTitle>
            <AlertDescription>
              <div className="mt-3 space-y-2">
                <p className="text-green-700">
                  <strong>Summary:</strong> {result.summary.success}/{result.summary.total} cars added
                </p>
                <div className="max-h-64 overflow-y-auto bg-white p-3 rounded text-sm">
                  {result.addedCars.map((car, index) => (
                    <div key={index} className="py-1 flex justify-between items-start">
                      <span className="font-medium">{car.name}</span>
                      <span className={`text-xs font-semibold ${car.status.includes('✓') ? 'text-green-600' : 'text-red-600'}`}>
                        {car.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={handleSeedCars} 
          disabled={loading}
          className="w-full py-6 text-lg"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Seeding Cars...
            </>
          ) : (
            'Seed Indian Cars to Inventory'
          )}
        </Button>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>ℹ️ Note:</strong> This will add 10 new cars to your inventory. Each car includes:
          </p>
          <ul className="text-sm text-blue-700 mt-2 list-disc list-inside space-y-1">
            <li>High-quality Unsplash images</li>
            <li>Realistic Indian market pricing</li>
            <li>Complete specifications</li>
            <li>Professional descriptions</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default SeedCarsComponent
