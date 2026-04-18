"use client";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge, Filter, Sliders, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import FilterControls from "./FilterControls";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CarFilters = ({ filters }) => {
  //WE CAN DIRECTLY SHARE THE FILTER URL WITH SOMEONE
  const router = useRouter();
  const pathName = usePathname();
  const searchParams = useSearchParams();

  //GET CURRENT FILTER VALUES FROM SEARCHPARAMS
  const currentMake = searchParams.get("make") || "";
  const currentBodyType = searchParams.get("bodyType") || "";
  const currentFuelType = searchParams.get("fuelType") || "";
  const currentTransmission = searchParams.get("transmission") || "";
  const currentMinPrice = searchParams.get("minPrice")
    ? parseInt(searchParams.get("minPrice"))
    : filters.priceRange.min;
  const currentMaxPrice = searchParams.get("maxPrice")
    ? parseInt(searchParams.get("maxPrice"))
    : filters.priceRange.max;

  const currentSortBy = searchParams.get("sortBy") || "newest";

  //STATE FOR FILTERS
  const [make, setMake] = useState(currentMake);
  const [bodyType, setBodyType] = useState(currentBodyType);
  const [fuelType, setFuelType] = useState(currentFuelType);
  const [transmission, setTransmission] = useState(currentTransmission);
  const [priceRange, setPriceRange] = useState([
    currentMinPrice,
    currentMaxPrice,
  ]);
  const [sortBy, setSortBy] = useState(currentSortBy);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const activeFilterCount = [
    make,
    bodyType,
    fuelType,
    transmission,
    currentMinPrice > filters.priceRange.min ||
      currentMinPrice < filters.priceRange.max,
  ].filter(Boolean).length;

  const currentFilters = {
    make,
    bodyType,
    fuelType,
    transmission,
    priceRange,
    priceRangeMin: filters.priceRange.min,
    priceRangeMax: filters.priceRange.max,
  };

  // Update URL when filters change
  const applyFilters = useCallback(() => {
    const params = new URLSearchParams();

    if (make) params.set("make", make);
    if (bodyType) params.set("bodyType", bodyType);
    if (fuelType) params.set("fuelType", fuelType);
    if (transmission) params.set("transmission", transmission);
    if (priceRange[0] > filters.priceRange.min)
      params.set("minPrice", priceRange[0].toString());
    if (priceRange[1] < filters.priceRange.max)
      params.set("maxPrice", priceRange[1].toString());
    if (sortBy !== "newest") params.set("sortBy", sortBy);

    // Preserve search and page params if they exist
    const search = searchParams.get("search");
    const page = searchParams.get("page");
    if (search) params.set("search", search);
    if (page && page !== "1") params.set("page", page);

    const query = params.toString();
    const url = query ? `${pathName}?${query}` : pathName;

    router.push(url);
    setIsSheetOpen(false);
  }, [
    make,
    bodyType,
    fuelType,
    transmission,
    priceRange,
    sortBy,
    pathName,
    searchParams,
    filters.priceRange.min,
    filters.priceRange.max,
  ]);

  //HANDLE FILTER CHANGE FUNCTION
  const onFilterChange = (filterName, value) => {
    switch (filterName) {
      case "make":
        setMake(value);
        break;
      case "bodyType":
        setBodyType(value);
        break;
      case "fuelType":
        setFuelType(value);
        break;
      case "transmission":
        setTransmission(value);
        break;
      case "priceRange":
        setPriceRange(value);
        break;
    }
  };

  //HANDLE CLEAR FILTER FUNCTION
  const onClearFilter = (filterName) => {
    onFilterChange(filterName, "");
  };

  //HANDLE CLEAR ALL FILTERS FUNCTION
  const clearFilters = () => {
    setMake("");
    setBodyType("");
    setFuelType("");
    setTransmission("");
    setPriceRange([filters.priceRange.min, filters.priceRange.max]);
    setSortBy("newest");

    const params = new URLSearchParams();
    const search = searchParams.get("search");
    if (search) params.set("search", search);

    const query = params.toString();
    const url = query ? `${pathName}?${query}` : pathName;
    router.push(url);
    setIsSheetOpen(false);
  };

  //UPDATE STATE WHEN URL PARAM CHANGES
  useEffect(() => {
    setMake(currentMake);
    setBodyType(currentBodyType);
    setFuelType(currentFuelType);
    setTransmission(currentTransmission);
    setPriceRange([currentMinPrice, currentMaxPrice]);
    setSortBy(currentSortBy);
  }, [
    currentMake,
    currentBodyType,
    currentFuelType,
    currentTransmission,
    currentMinPrice,
    currentMaxPrice,
    currentSortBy,
  ]);
  return (
    <div className="flex lg:flex-col justify-between gap-4">
      {/* MOBILE FILTERS */}
      <div className="lg:hidden mb-4">
        <div className="flex items-center">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge className="ml-1 justify-center h-5 w-5 rounded-full p-0 flex items-center">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent
              className="w-full sm:max-w-md overflow-y-auto"
              side="left"
            >
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="py-6">
                <FilterControls
                  filters={filters}
                  currentFilters={currentFilters}
                  onClearFilter={onClearFilter}
                  onFilterChange={onFilterChange}
                />
              </div>

              <SheetFooter className="sm:justify-between flex-row pt-2 border-t space-x-4 mt-auto">
                <Button
                  onClick={clearFilters}
                  className="flex-1"
                  type="button"
                  variant="outline"
                >
                  Reset
                </Button>
                <Button onClick={applyFilters} type="button" className="flex-1">
                  Show Results
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* SORT SELECTION */}
      <Select
        onValueChange={(value) => {
          setSortBy(value);
          setTimeout(() => applyFilters(), 0);
        }}
        value={sortBy}
      >
        <SelectTrigger className="w-[180px] lg:w-full">
          <SelectValue placeholder="Sort By" />
        </SelectTrigger>

        <SelectContent>
          {[
            { value: "newest", label: "Newest First" },
            { value: "priceAsc", label: "Price: Low to High" },
            { value: "priceDesc", label: "Price: Hight to Low" },
          ].map((option) => {
            return (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {/* DESKTOP FILTERS */}
      <div className="hidden lg:block sticky top-24">
        <div className="border rounded-lg overflow-hidden bg-white">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <h3 className="font-medium flex items-center">
              <Sliders className="mr-2 h-4 w-4" />
              Filters
            </h3>
            {activeFilterCount > 0 && (
              <Button
                onClick={clearFilters}
                className="h-8 text-gray-800 text-sm "
                variant="ghost"
                size="sm"
              >
                <X className="mr-1 h-3 w-3" />
                Clear All
              </Button>
            )}
          </div>
       

        <div className="p-4">
          <FilterControls
            filters={filters}
            currentFilters={currentFilters}
            onClearFilter={onClearFilter}
            onFilterChange={onFilterChange}
          />
        </div>

        <div className="px-4 py-4 border-t">
          <Button onClick={applyFilters} className="w-full">
            Apply Filters
          </Button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default CarFilters;
