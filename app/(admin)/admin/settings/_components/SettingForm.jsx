"use client";
import {
  getDealershipInfo,
  getUsers,
  saveWorkingHours,
  updateHeroImage,
  updateUserRole,
} from "@/actions/settings";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useFetch from "@/hooks/use-fetch";
import { Clock, Loader2, Save, Search, Shield, Users } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

const DAYS = [
  { value: "MONDAY", label: "Monday" },
  { value: "TUESDAY", label: "Tuesday" },
  { value: "WEDNESDAY", label: "Wednesday" },
  { value: "THURSDAY", label: "Thursday" },
  { value: "FRIDAY", label: "Friday" },
  { value: "SATURDAY", label: "Saturday" },
  { value: "SUNDAY", label: "Sunday" },
];

const SettingForm = () => {
  const [userSearch, setUserSearch] = useState("");
  const [heroImageBase64, setHeroImageBase64] = useState("");
  const [heroPreview, setHeroPreview] = useState("");
  const [workingHours, setWorkingHours] = useState(
    DAYS.map((day) => ({
      dayOfWeek: day.value,
      openTime: "09:00",
      closeTime: "18:00",
      isOpen: day.value !== "SUNDAY",
    }))
  );
  // Custom hooks for API calls
  const {
    loading: fetchingSettings,
    fn: fetchDealershipInfo,
    data: settingsData,
    error: settingsError,
  } = useFetch(getDealershipInfo);

  const {
    loading: savingHours,
    fn: saveHours,
    data: saveResult,
    error: saveError,
  } = useFetch(saveWorkingHours);

  const {
    loading: fetchingUsers,
    fn: fetchUsers,
    data: usersData,
    error: usersError,
  } = useFetch(getUsers);

  const {
    loading: updatingRole,
    fn: updateRole,
    data: updateRoleResult,
    error: updateRoleError,
  } = useFetch(updateUserRole);

  const {
    loading: updatingHeroImage,
    fn: saveHeroImage,
    data: heroUpdateResult,
    error: heroUpdateError,
  } = useFetch(updateHeroImage);

  const handleWorkingHourChange = (index, field, value) => {
    const updatedHours = [...workingHours];
    updatedHours[index] = {
      ...updatedHours[index],
      [field]: value,
    };
    setWorkingHours(updatedHours);
  };

  const handleSaveHours = async () => {
    await saveHours(workingHours);
  };

  const handleMakeAdmin = async (user) => {
    if (
      confirm(`Are you sure you want to give admin privileges to ${user.name}?`)
    ) {
      await updateRole(user.id, "ADMIN");
    }
  };

  const handleRemoveAdmin = async (user) => {
    if (
      confirm(
        `Are you sure you want to remove admin privileges from ${user.name}?`
      )
    ) {
      await updateRole(user.id, "USER");
    }
  };

  const handleHeroFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result?.toString() || "";
      setHeroImageBase64(result);
      setHeroPreview(result);
    };
    reader.onerror = () => {
      toast.error("Failed to read image file");
    };
    reader.readAsDataURL(file);
  };

  const handleSaveHeroImage = async () => {
    if (!heroImageBase64) {
      toast.error("Please select an image first");
      return;
    }
    await saveHeroImage(heroImageBase64);
  };

  const filteredUsers = usersData?.success
    ? usersData.data.filter((user) => {
        return (
          user.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
          user.email?.toLowerCase().includes(userSearch.toLowerCase())
        );
      })
    : [];

  // Set working hours when settings data is fetched
  useEffect(() => {
    if (settingsData?.success && settingsData.data) {
      const dealership = settingsData.data;
      if (dealership.heroImageUrl) {
        setHeroPreview(dealership.heroImageUrl);
      }

      // Map the working hours
      if (dealership.workingHours.length > 0) {
        const mappedHours = DAYS.map((day) => {
          // Find matching working hour
          const hourData = dealership.workingHours.find(
            (h) => h.dayOfWeek === day.value
          );

          if (hourData) {
            return {
              dayOfWeek: hourData.dayOfWeek,
              openTime: hourData.openTime,
              closeTime: hourData.closeTime,
              isOpen: hourData.isOpen,
            };
          }

          // Default values if no working hour is found
          return {
            dayOfWeek: day.value,
            openTime: "09:00",
            closeTime: "18:00",
            isOpen: day.value !== "SUNDAY",
          };
        });

        setWorkingHours(mappedHours);
      }
    }
  }, [settingsData]);

  useEffect(() => {
    if (saveResult?.success) {
      toast.success("Working hours saved successfully");
      fetchDealershipInfo();
    }

    if (heroUpdateResult?.success) {
      toast.success("Hero image updated successfully");
      fetchDealershipInfo();
    }

    if (updateRoleResult?.success) {
      toast.success("User role updated successfully");
      fetchUsers();
    }
  }, [saveResult, heroUpdateResult, updateRoleResult]);

  useEffect(() => {
    fetchDealershipInfo();
    fetchUsers();
  }, []);

  // Handle errors
  useEffect(() => {
    if (settingsError) {
      toast.error("Failed to load dealership settings");
    }

    if (saveError) {
      toast.error(`Failed to save working hours: ${saveError.message}`);
    }

    if (usersError) {
      toast.error("Failed to load users");
    }

    if (updateRoleError) {
      toast.error(`Failed to update user role: ${updateRoleError.message}`);
    }

    if (heroUpdateError) {
      toast.error(`Failed to update hero image: ${heroUpdateError.message}`);
    }
  }, [settingsError, saveError, usersError, updateRoleError, heroUpdateError]);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="hours">
        <TabsList>
          <TabsTrigger value="hours">
            <Clock className="h-4 w-4 mr-2" />
            Working Hours
          </TabsTrigger>
          <TabsTrigger value="branding">
            <Save className="h-4 w-4 mr-2" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="admins">
            <Shield className="h-4 w-4 mr-2" />
            Admin Users
          </TabsTrigger>
        </TabsList>
        <TabsContent value="branding" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Homepage Hero Image</CardTitle>
              <CardDescription>
                Update the image shown in the homepage hero section.
              </CardDescription>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-[220px_1fr] items-start">
                  <div className="w-full overflow-hidden rounded-xl border border-border bg-muted/40">
                    {heroPreview ? (
                      <img
                        src={heroPreview}
                        alt="Hero preview"
                        className="h-40 w-full object-cover"
                      />
                    ) : (
                      <div className="h-40 w-full flex items-center justify-center text-sm text-muted-foreground">
                        No image selected
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="hero-image">Upload new image</Label>
                      <Input
                        id="hero-image"
                        type="file"
                        accept="image/*"
                        onChange={handleHeroFileChange}
                        className="mt-2"
                      />
                    </div>
                    <Button
                      onClick={handleSaveHeroImage}
                      disabled={updatingHeroImage}
                    >
                      {updatingHeroImage ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Hero Image
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </CardHeader>
          </Card>
        </TabsContent>
        <TabsContent value="hours" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Working Hours</CardTitle>
              <CardDescription>
                Set your dealership's working hours for each day of week
              </CardDescription>

              <CardContent>
                <div className="space-y-4">
                  {DAYS.map((day, index) => {
                    return (
                      <div
                        className="grid grid-cols-12 
                                                gap-4 items-center py-3 px-4 rounded-lg
                                                hover:bg-slate-50"
                        key={day.value}
                      >
                        <div className="col-span-3 md:col-span-2">
                          <div className="font-medium">{day.label}</div>
                        </div>

                        <div className="col-span-9 md:col-span-2 flex items-center">
                          <Checkbox
                            id={`is-open-${day.value}`}
                            checked={workingHours[index]?.isOpen}
                            onCheckedChange={(checked) => {
                              handleWorkingHourChange(index, "isOpen", checked);
                            }}
                          />
                          <Label className="ml-2 cursor-pointer">
                            {workingHours[index]?.isOpen ? "Open" : "Closed"}
                          </Label>
                        </div>

                        {workingHours[index]?.isOpen && (
                          <>
                            <div className="col-span-4 md:col-span-3">
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 text-gray-400 mr-2" />
                                <Input
                                  type="time"
                                  className="text-sm"
                                  value={workingHours[index]?.openTime}
                                  onChange={(e) => {
                                    handleWorkingHourChange(
                                      index,
                                      "openTime",
                                      e.target.value
                                    );
                                  }}
                                />
                              </div>
                            </div>

                            <div className="text-center col-span-1">to</div>
                            <div className="col-span-4 md:col-span-3">
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 text-gray-400 mr-2" />
                                <Input
                                  type="time"
                                  className="text-sm"
                                  value={workingHours[index]?.closeTime}
                                  onChange={(e) => {
                                    handleWorkingHourChange(
                                      index,
                                      "closeTime",
                                      e.target.value
                                    );
                                  }}
                                />
                              </div>
                            </div>
                          </>
                        )}

                        {!workingHours[index]?.isOpen && (
                          <div
                            className="col-span-11 md:col-span-8 text-gray-500
                                                    italic text-sm"
                          >
                            Closed All day
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 flex justify-end">
                  <Button disabled={savingHours} onClick={handleSaveHours}>
                    {savingHours ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving....
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Working Hours
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </CardHeader>
          </Card>
        </TabsContent>
        <TabsContent value="admins" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Admin Users</CardTitle>
              <CardDescription>
                Manage Users With Admin privileges.
              </CardDescription>
              <CardContent>
                <div className="mb-6 relative">
                  <Search className="absolute text-gray-500 left-2.5 top-2.5 h-4 w-4" />
                  <Input
                    type="search"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search users..."
                    className="pl-9 w-full"
                  />
                </div>

                {fetchingUsers ? (
                  <div className="py-12 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-800" />
                  </div>
                ) : usersData?.success && filteredUsers.length > 0 ? (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead className={"text-right"}>
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {filteredUsers.map((user) => {
                          return (
                            <TableRow key={user.id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                    {user.imageUrl ? (
                                      <img
                                        src={user.imageUrl}
                                        alt={user.name || "User"}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <Users className="h-4 w-4 text-gray-500" />
                                    )}
                                  </div>
                                  <span>{user.name || "Unnamed User"}</span>
                                </div>
                              </TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>{user.role}</TableCell>
                              <TableCell className={"text-right"}>
                                {user.role == "ADMIN" ? (
                                  <Button
                                    size={"sm"}
                                    className={"text-red-500"}
                                    onClick={() => handleRemoveAdmin(user)}
                                    disabled={updatingRole}
                                    variant="outline"
                                  >
                                    Remove Admin
                                  </Button>
                                ) : (
                                  <Button
                                    size={"sm"}
                                    onClick={() => handleMakeAdmin(user)}
                                    disabled={updatingRole}
                                    variant="outline"
                                  >
                                    Make Admin
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </>
                ) : (
                  <div className="py-12 text-center">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      No Users Found
                    </h3>
                  </div>
                )}
              </CardContent>
            </CardHeader>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingForm;
