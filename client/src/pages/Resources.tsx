import { Layout } from "@/components/Layout";
import { useResources, useCreateResource } from "@/hooks/use-resources";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertResourceSchema, type InsertResource } from "@shared/schema";
import { Plus, Search, Pill, Stethoscope, Users, Box } from "lucide-react";
import { useState } from "react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

export default function Resources() {
  const { data: resources, isLoading } = useResources();
  const createResource = useCreateResource();
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<InsertResource>({
    resolver: zodResolver(insertResourceSchema),
    defaultValues: {
      name: "",
      type: "medication",
      description: "",
    },
  });

  const onSubmit = async (data: InsertResource) => {
    try {
      await createResource.mutateAsync(data);
      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const filteredResources = resources?.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) || 
    r.type.toLowerCase().includes(search.toLowerCase())
  );

  const getIcon = (type: string) => {
    switch (type) {
      case 'medication': return <Pill className="w-6 h-6 text-blue-500" />;
      case 'staff': return <Users className="w-6 h-6 text-purple-500" />;
      case 'equipment': return <Stethoscope className="w-6 h-6 text-green-500" />;
      default: return <Box className="w-6 h-6 text-gray-500" />;
    }
  };

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-display">Medical Resources</h1>
          <p className="text-muted-foreground mt-1">Manage catalog of medications, equipment, and staff.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-blue-500/20">
              <Plus className="w-4 h-4 mr-2" />
              Add Resource
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Resource</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resource Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Amoxicillin 500mg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="medication">Medication</SelectItem>
                          <SelectItem value="equipment">Equipment</SelectItem>
                          <SelectItem value="staff">Staff</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Details about this resource..." {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={createResource.isPending}>
                  {createResource.isPending ? "Adding..." : "Add Resource"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input 
          className="pl-10 h-12 rounded-xl bg-white border-gray-200" 
          placeholder="Search resources by name or type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources?.map((resource) => (
            <div 
              key={resource.id} 
              className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`
                  p-3 rounded-xl transition-colors duration-300
                  ${resource.type === 'medication' ? 'bg-blue-50 group-hover:bg-blue-100' :
                    resource.type === 'equipment' ? 'bg-green-50 group-hover:bg-green-100' :
                    'bg-purple-50 group-hover:bg-purple-100'}
                `}>
                  {getIcon(resource.type)}
                </div>
                <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
                  {resource.type}
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-2">{resource.name}</h3>
              <p className="text-sm text-gray-500 line-clamp-2">
                {resource.description || "No description provided."}
              </p>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
