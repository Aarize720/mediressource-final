import { Layout } from "@/components/Layout";
import { useStocks, useUpdateStock } from "@/hooks/use-stocks";
import { useResources } from "@/hooks/use-resources";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertStockSchema, type InsertStock } from "@shared/schema";
import { MapPin, RefreshCw, Plus, Search } from "lucide-react";
import { useState } from "react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Stocks() {
  const [cityFilter, setCityFilter] = useState("");
  const { data: stocks, isLoading } = useStocks(cityFilter || undefined);
  const { data: resources } = useResources();
  const updateStock = useUpdateStock();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<InsertStock>({
    resolver: zodResolver(insertStockSchema),
    defaultValues: {
      quantity: 0,
      city: "",
      postalCode: "",
    },
  });

  const onSubmit = async (data: InsertStock) => {
    try {
      await updateStock.mutateAsync(data);
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
          <h1 className="text-3xl font-bold text-gray-900 font-display">Stock Management</h1>
          <p className="text-muted-foreground mt-1">Track and update resource quantities by location.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <RefreshCw className="w-4 h-4 mr-2" />
              Update Stock
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Resource Stock</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="resourceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resource</FormLabel>
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
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="Paris" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postal Code</FormLabel>
                        <FormControl>
                          <Input placeholder="75001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Quantity</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={updateStock.isPending}>
                  {updateStock.isPending ? "Updating..." : "Update Stock"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-gray-50/50 flex items-center gap-3">
          <MapPin className="w-4 h-4 text-gray-400" />
          <Input 
            className="max-w-xs bg-white h-9" 
            placeholder="Filter by city..." 
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Resource</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Last Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">Loading stocks...</TableCell>
              </TableRow>
            ) : stocks?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No stock records found for this location.
                </TableCell>
              </TableRow>
            ) : (
              stocks?.map((stock) => (
                <TableRow key={stock.id}>
                  <TableCell className="font-medium text-gray-900">{stock.resource.name}</TableCell>
                  <TableCell className="capitalize text-muted-foreground">{stock.resource.type}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{stock.city}</span>
                      <span className="text-xs text-muted-foreground">{stock.postalCode}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`
                      px-2 py-1 rounded-full text-xs font-bold
                      ${stock.quantity < 10 ? "bg-red-100 text-red-700" : 
                        stock.quantity < 50 ? "bg-yellow-100 text-yellow-700" : 
                        "bg-green-100 text-green-700"}
                    `}>
                      {stock.quantity} units
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {stock.updatedAt ? new Date(stock.updatedAt).toLocaleDateString() : 'N/A'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Layout>
  );
}
