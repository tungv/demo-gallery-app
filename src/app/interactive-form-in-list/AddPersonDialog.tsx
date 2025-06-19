import {
  Form,
  FormField,
  FormLabel,
  FormSubmit,
  InputControl,
} from "@/components/ui/form";

import { Button } from "@/components/ui/button";
import { ReserveLayout } from "@/components/ui/reserve-layout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  InteractiveForm,
  LoadingMessage,
  SubmitMessage,
} from "@/components/behaviors/interactive-form";
import { Plus } from "lucide-react";
import type { NewPersonData } from "./actions";
import { addPersonToStorage } from "./data-store";

// Random data generator
function generateRandomPersonData(): NewPersonData {
  const firstNames = [
    "Alex",
    "Jordan",
    "Morgan",
    "Taylor",
    "Casey",
    "Riley",
    "Avery",
    "Quinn",
    "Sage",
    "River",
    "Phoenix",
    "Rowan",
    "Emery",
    "Drew",
    "Blake",
    "Parker",
  ];

  const lastNames = [
    "Anderson",
    "Johnson",
    "Williams",
    "Brown",
    "Jones",
    "Garcia",
    "Miller",
    "Davis",
    "Rodriguez",
    "Martinez",
    "Hernandez",
    "Lopez",
    "Gonzalez",
    "Wilson",
    "Moore",
    "Taylor",
    "Jackson",
    "Lee",
    "Perez",
    "Thompson",
  ];

  const domains = [
    "gmail.com",
    "yahoo.com",
    "outlook.com",
    "company.com",
    "tech.io",
    "startup.co",
    "business.net",
    "enterprise.org",
    "innovation.ai",
  ];

  const streetTypes = ["St", "Ave", "Blvd", "Dr", "Ln", "Rd", "Way", "Ct"];
  const cities = [
    "San Francisco",
    "New York",
    "Chicago",
    "Seattle",
    "Austin",
    "Boston",
    "Portland",
    "Miami",
    "Denver",
    "Los Angeles",
    "Phoenix",
    "Atlanta",
  ];

  const states = [
    "CA",
    "NY",
    "IL",
    "WA",
    "TX",
    "MA",
    "OR",
    "FL",
    "CO",
    "AZ",
    "GA",
    "NV",
  ];

  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  const streetType =
    streetTypes[Math.floor(Math.random() * streetTypes.length)];
  const city = cities[Math.floor(Math.random() * cities.length)];
  const state = states[Math.floor(Math.random() * states.length)];

  const streetNumber = Math.floor(Math.random() * 9999) + 1;
  const streetName = `${
    Math.random() > 0.5 ? firstName : lastName
  } ${streetType}`;

  return {
    name: `${firstName} ${lastName}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
    phone: `${Math.floor(Math.random() * 800) + 200}-555-${String(
      Math.floor(Math.random() * 10000),
    ).padStart(4, "0")}`,
    address: `${streetNumber} ${streetName}`,
    city,
    state,
    zip: String(Math.floor(Math.random() * 90000) + 10000),
  };
}

export default function AddPersonDialog() {
  const randomized = generateRandomPersonData();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="size-4" />
          Add person
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add person</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Data for this form is automatically generated to save time for
          testing.
        </DialogDescription>
        <Form asChild className="contents">
          <InteractiveForm
            fields={[
              "new_person_name",
              "new_person_email",
              "new_person_phone",
              "new_person_address",
              "new_person_city",
              "new_person_state",
              "new_person_zip",
            ]}
            className="data-[user-invalid]:border-red-500 border rounded-md shadow-sm space-y-4 p-4"
            action={async (formData) => {
              "use server";

              const newPersonData: NewPersonData = {
                name: formData.get("new_person_name") as string,
                email: formData.get("new_person_email") as string,
                phone: formData.get("new_person_phone") as string,
                address: formData.get("new_person_address") as string,
                city: formData.get("new_person_city") as string,
                state: formData.get("new_person_state") as string,
                zip: formData.get("new_person_zip") as string,
              };

              try {
                await addPersonToStorage(newPersonData);
                return {
                  refresh: true,
                };
              } catch (error) {
                console.error(error);
                return {
                  errors: {
                    $: ["Failed to add person"],
                  },
                };
              }
            }}
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField name="new_person_name" className="col-span-2">
                <FormLabel>Name *</FormLabel>
                <InputControl asChild>
                  <Input
                    placeholder="Full name"
                    required
                    defaultValue={randomized.name}
                  />
                </InputControl>
              </FormField>

              <FormField name="new_person_email" className="col-span-2">
                <FormLabel>Email *</FormLabel>
                <InputControl asChild>
                  <Input
                    placeholder="email@example.com"
                    type="email"
                    required
                    defaultValue={randomized.email}
                  />
                </InputControl>
              </FormField>

              <FormField name="new_person_phone" className="col-span-2">
                <FormLabel>Phone</FormLabel>
                <InputControl asChild>
                  <Input
                    placeholder="(555) 123-4567"
                    type="tel"
                    defaultValue={randomized.phone}
                  />
                </InputControl>
              </FormField>

              <FormField name="new_person_address" className="col-span-2">
                <FormLabel>Address</FormLabel>
                <InputControl asChild>
                  <Input
                    placeholder="123 Main St"
                    defaultValue={randomized.address}
                  />
                </InputControl>
              </FormField>

              <FormField name="new_person_city">
                <FormLabel>City</FormLabel>
                <InputControl asChild>
                  <Input placeholder="City" defaultValue={randomized.city} />
                </InputControl>
              </FormField>

              <FormField name="new_person_state">
                <FormLabel>State</FormLabel>
                <InputControl asChild>
                  <Input
                    placeholder="CA"
                    maxLength={2}
                    defaultValue={randomized.state}
                  />
                </InputControl>
              </FormField>

              <FormField name="new_person_zip" className="col-span-2">
                <FormLabel>ZIP Code</FormLabel>
                <InputControl asChild>
                  <Input placeholder="12345" defaultValue={randomized.zip} />
                </InputControl>
              </FormField>
            </div>

            <DialogFooter className="flex gap-2 pt-4">
              <FormSubmit asChild>
                <Button>
                  <Plus className="size-4" />
                  <ReserveLayout>
                    <SubmitMessage>Add person</SubmitMessage>
                    <LoadingMessage>Adding…</LoadingMessage>
                  </ReserveLayout>
                </Button>
              </FormSubmit>
            </DialogFooter>
          </InteractiveForm>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
