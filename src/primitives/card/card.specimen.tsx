import { useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardListHeader,
  CardTitle,
} from "./card";

export function CardSpecimen() {
  const [query, setQuery] = useState("");
  return (
    <div className="flex flex-col gap-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Default card</CardTitle>
        </CardHeader>
        <CardContent>Content</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>
      <Card variant="interactive">
        <CardContent>Interactive card</CardContent>
      </Card>
      <Card variant="panel">
        <CardContent>Panel card</CardContent>
      </Card>
      <Card variant="ghost">
        <CardContent>Ghost card</CardContent>
      </Card>
      <Card rows>
        <CardListHeader
          label="Members"
          search={{ value: query, onChange: setQuery, placeholder: "Search" }}
        />
        <CardContent>Row one</CardContent>
        <CardContent>Row two</CardContent>
      </Card>
    </div>
  );
}
