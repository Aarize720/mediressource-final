import { Layout } from "@/components/Layout";
import { useAlerts, useCreateAlert } from "@/hooks/use-alerts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAlertSchema, type InsertAlert } from "@shared/schema";
import { AlertTriangle, Plus, ShieldAlert, MapPin, Info } from "lucide-react";
import { useState } from "react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";

export default function Alerts() {
  const { data: alerts, isLoading } = useAlerts();
  const createAlert = useCreateAlert();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<InsertAlert>({
    resolver: zodResolver(insertAlertSchema),
    defaultValues: {
      type: "shortage",
      severity: "medium",
      message: "",
      city: "",
      active: true,
    },
  });

  const onSubmit = async (data: InsertAlert) => {
    try {
      await createAlert.mutateAsync(data);
      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-display">Alert Network</h1>
          <p className="text-muted-foreground mt-1">National prevention and warning system.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" className="shadow-lg shadow-red-500/20">
              <ShieldAlert className="w-4 h-4 mr-2" />
              Report Issue
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Report Alert</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                            <SelectItem value="shortage">Resource Shortage</SelectItem>
                            <SelectItem value="epidemic">Epidemic Outbreak</SelectItem>
                            <SelectItem value="info">General Info</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="severity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Severity</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Severity" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Affected City (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Leave empty for national alert" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe the situation..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={createAlert.isPending}>
                  {createAlert.isPending ? "Reporting..." : "Submit Alert"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : alerts?.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed">
            <ShieldAlert className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No active alerts</h3>
            <p className="text-gray-500">The system is currently reporting no issues.</p>
          </div>
        ) : (
          alerts?.map((alert) => (
            <div 
              key={alert.id} 
              className={`
                relative overflow-hidden rounded-xl p-6 border transition-all duration-300 hover:shadow-md
                ${alert.active ? 'opacity-100' : 'opacity-60 bg-gray-50'}
                ${alert.severity === 'critical' ? 'bg-red-50 border-red-200' : 
                  alert.severity === 'high' ? 'bg-orange-50 border-orange-200' : 
                  'bg-white border-gray-200'}
              `}
            >
              {alert.severity === 'critical' && (
                <div className="absolute top-0 right-0 p-2">
                  <span className="flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                </div>
              )}
              
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                <div className={`
                  p-3 rounded-full shrink-0 self-start
                  ${alert.severity === 'critical' ? 'bg-red-100 text-red-600' : 
                    alert.severity === 'high' ? 'bg-orange-100 text-orange-600' : 
                    'bg-blue-100 text-blue-600'}
                `}>
                  {alert.type === 'shortage' ? <AlertTriangle className="w-6 h-6" /> : 
                   alert.type === 'epidemic' ? <ShieldAlert className="w-6 h-6" /> : 
                   <Info className="w-6 h-6" />}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-gray-900">{alert.type.toUpperCase()}</h3>
                    <span className={`
                      text-xs px-2 py-0.5 rounded-full font-bold uppercase
                      ${alert.severity === 'critical' ? 'bg-red-200 text-red-800' : 
                        alert.severity === 'high' ? 'bg-orange-200 text-orange-800' : 
                        'bg-blue-200 text-blue-800'}
                    `}>
                      {alert.severity}
                    </span>
                    {!alert.active && <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">RESOLVED</span>}
                  </div>
                  
                  <p className="text-gray-700 mb-2">{alert.message}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {alert.city || "National"}
                    </span>
                    <span>•</span>
                    <span>
                      Reported on {alert.createdAt && format(new Date(alert.createdAt), 'MMMM d, yyyy')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Layout>
  );
}
