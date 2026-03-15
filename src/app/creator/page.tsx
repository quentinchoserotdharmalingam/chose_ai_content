"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, Plus, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Resource {
  id: string;
  title: string | null;
  status: string;
  createdAt: string;
  contents: Array<{ format: string }>;
}

export default function CreatorDashboard() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/resources")
      .then((res) => res.json())
      .then((data) => {
        setResources(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    await fetch(`/api/resources/${id}`, { method: "DELETE" });
    setResources((prev) => prev.filter((r) => r.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mes ressources</h1>
        <Link href="/creator/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle ressource
          </Button>
        </Link>
      </div>

      {resources.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-gray-500">Aucune ressource pour le moment</p>
          <Link href="/creator/new">
            <Button className="mt-4" variant="outline">
              Créer ma première ressource
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {resources.map((resource) => (
            <Card key={resource.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{resource.title || "Sans titre"}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        resource.status === "generated" || resource.status === "published"
                          ? "bg-green-50 text-green-700"
                          : resource.status === "analyzed"
                          ? "bg-yellow-50 text-yellow-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {resource.status}
                    </span>
                    {resource.contents.length > 0 && (
                      <span className="text-xs text-gray-400">
                        {resource.contents.length} format(s)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {(resource.status === "generated" || resource.status === "published") && (
                    <Link href={`/consume/${resource.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(resource.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
