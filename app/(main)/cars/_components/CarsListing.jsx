'use client'

import { getCars } from '@/actions/car-listing'
import useFetch from '@/hooks/use-fetch'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import CarListingsLoading from './CarListingsLoading'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import CarCard from '@/components/CarCard'

const CarsListing = () => {
  const limit = 6
  //GET FILTERS FROM SEARCH PARAMS
  const searchParams = useSearchParams();
  const router = useRouter();

  //GET CURRENT FILTER VALUES FROM SEARCHPARAMS
  const search = searchParams.get("search") || "";
  const make = searchParams.get("make") || "";
  const bodyType = searchParams.get("bodyType") || "";
  const fuelType = searchParams.get("fuelType") || "";
  const transmission = searchParams.get("transmission") || "";
  const minPrice = searchParams.get("minPrice") || 0;
  const maxPrice = searchParams.get("maxPrice") || Number.MAX_SAFE_INTEGER
  const sortBy = searchParams.get("sortBy") || "newest";
  const page = parseInt(searchParams.get("page") || "1");


  //CALL API TO GET CARS
  const { loading, fn: fetchCars, data: result, error } = useFetch(getCars)
  console.log('data',result);

  useEffect(() => {
    fetchCars({
      search, make, bodyType, fuelType, transmission, minPrice, maxPrice, sortBy, page, limit
    })
  }, [
    search, make, bodyType, fuelType, transmission, minPrice, maxPrice, sortBy, page
  ])
  if(loading && !result){
    return(
      <CarListingsLoading />
    )
  }

  if(error || (!result && !result?.success)){
    <Alert variant="destructive">
      <Info className='h-4 w-4'/>
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>Failed to load cars. Please try again later</AlertDescription>
    </Alert>
  }
  if(!result || !result?.data) return null;
  const {data:cars , pagination} = result;
  
  const handlePreviousPage = () => {
    if (page > 1) {
      const params = new URLSearchParams(searchParams);
      params.set("page", page - 1);
      router.push(`?${params.toString()}`);
    }
  };

  const handleNextPage = () => {
    if (page < pagination.pages) {
      const params = new URLSearchParams(searchParams);
      params.set("page", page + 1);
      router.push(`?${params.toString()}`);
    }
  };

  // No results
  if (cars.length === 0) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-8 border rounded-lg bg-gray-50">
        <div className="bg-gray-100 p-4 rounded-full mb-4">
          <Info className="h-8 w-8 text-gray-500" />
        </div>
        <h3 className="text-lg font-medium mb-2">No cars found</h3>
        <p className="text-gray-500 mb-6 max-w-md">
          We couldn't find any cars matching your search criteria. Try adjusting
          your filters or search term.
        </p>
        <Button variant="outline" asChild>
          <Link href="/cars">Clear all filters</Link>
        </Button>
      </div>
    );
  }
  return (
    <div>
      <div className='flex justify-between items-center mb-6'>
        <p className='text-gray-600'>
          Showing <span className='font-medium'>
            {(page-1)* limit+1} - {Math.min(page*limit, pagination.total)}
          </span> of <span className='font-medium'>{pagination.total}</span> cars
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {cars.map((car)=>{
          return(
            <CarCard key={car.id} car={car}/>
          )
        })}
      </div>

      {/* PAGINATION BUTTONS */}
      <div className='flex justify-center items-center gap-4 mt-8'>
        {page > 1 && (
          <Button 
            variant="outline" 
            onClick={handlePreviousPage}
            className="px-6"
          >
            ← Previous
          </Button>
        )}

        <div className='flex items-center gap-2'>
          <span className='text-gray-600'>
            Page <span className='font-medium'>{page}</span> of <span className='font-medium'>{pagination.pages}</span>
          </span>
        </div>

        {page < pagination.pages && (
          <Button 
            variant="default" 
            onClick={handleNextPage}
            className="px-6"
          >
            Next →
          </Button>
        )}
      </div>
    </div>
  )
}

export default CarsListing