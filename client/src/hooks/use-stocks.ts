import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertStock } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useStocks(city?: string) {
  return useQuery({
    queryKey: [api.stocks.list.path, city],
    queryFn: async () => {
      const url = city 
        ? `${api.stocks.list.path}?city=${encodeURIComponent(city)}` 
        : api.stocks.list.path;
        
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stocks");
      return api.stocks.list.responses[200].parse(await res.json());
    },
  });
}

export function useUpdateStock() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertStock) => {
      const res = await fetch(api.stocks.update.path, {
        method: api.stocks.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.stocks.update.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to update stock");
      }
      return api.stocks.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.stocks.list.path] });
      toast({
        title: "Success",
        description: "Stock updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
