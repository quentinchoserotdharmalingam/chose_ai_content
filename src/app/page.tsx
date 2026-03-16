import Link from "next/link";
import { Brain, Upload, BookOpen, GraduationCap } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex flex-col items-center gap-8 py-8 sm:py-12">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100">
          <Brain className="h-8 w-8 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Ressource IA</h1>
        <p className="mt-2 max-w-md text-gray-500">
          Transformez vos documents en expériences d&apos;apprentissage multi-format
        </p>
      </div>

      <div className="grid w-full max-w-lg gap-4">
        {/* Creator section */}
        <p className="text-xs font-medium uppercase text-gray-400">Créateur (RH)</p>

        <Link href="/creator/new">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                  <Upload className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Créer une ressource</CardTitle>
                  <CardDescription>Uploadez un PDF et générez du contenu IA</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/creator">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                  <BookOpen className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle>Mes ressources</CardTitle>
                  <CardDescription>Gérer et consulter vos ressources créées</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>

        {/* Enrollee section */}
        <p className="mt-4 text-xs font-medium uppercase text-gray-400">Enrollee (Apprenant)</p>

        <Link href="/consume">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                  <GraduationCap className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle>Mes formations</CardTitle>
                  <CardDescription>
                    Accéder aux ressources qui vous sont assignées
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
