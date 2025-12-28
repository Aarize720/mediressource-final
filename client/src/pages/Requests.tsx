import { Layout } from "@/components/Layout";
import { useRequests, useCreateRequest } from "@/hooks/use-requests";
import { useResources } from "@/hooks/use-resources";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRequestSchema, type InsertRequest } from "@shared/schema";
import { ClipboardList, Plus, Clock, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { format } from "date-fns";

export default function Requests() {
  const { data: requests, isLoading } = useRequests();
  const { data: resources } = useResources();
  const createRequest = useCreateRequest();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<InsertRequest>({
    resolver: zodResolver(insertRequestSchema),
    defaultValues: {
      quantity: 1,
      urgency: "medium",
    },
  });

  const onSubmit = async (data: InsertRequest) => {
    try {
      await createRequest.mutateAsync(data);
      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'approved': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'fulfilled': return 'bg-green-100 text-green-700 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-display">Resource Requests</h1>
          <p className="text-muted-foreground mt-1">Track and submit resource requisitions.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Resources</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="resourceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resource Needed</FormLabel>
                      <Select 
                        onValueChange={(val) => field.onChange(parseInt(val))} 
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select resource" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {resources?.map((r) => (
                            <SelectItem key={r.id} value={r.id.toString()}>
                              {r.name} ({r.type})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="urgency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Urgency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select urgency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={createRequest.isPending}>
                  {createRequest.isPending ? "Submitting..." : "Submit Request"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : requests?.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed">
            <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No requests found</h3>
            <p className="text-gray-500">You haven't submitted any resource requests yet.</p>
          </div>
        ) : (
          requests?.map((request) => (
            <div 
              key={request.id} 
              className="bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-bold text-gray-900 text-lg">{request.resource.name}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${getStatusColor(request.status)}`}>
                    {request.status}
                  </span>
                </div>
                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <span>Quantity: <strong className="text-gray-900">{request.quantity}</strong></span>
                  <span className="flex items-center gap-1">
                    Priority: 
                    <span className={`capitalize font-medium ${
                      request.urgency === 'high' ? 'text-red-600' : 
                      request.urgency === 'medium' ? 'text-orange-600' : 
                      'text-green-600'
                    }`}>
                      {request.urgency}
                    </span>
                  </span>
                  <span>Requested: {request.createdAt && format(new Date(request.createdAt), 'MMM d, yyyy')}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6">
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs text-gray-400">Request ID</span>
                  <span className="font-mono text-sm">REQ-{request.id.toString().padStart(4, '0')}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Layout>
  );
}
