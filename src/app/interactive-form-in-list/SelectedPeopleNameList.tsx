"use client";

import { useSelectedRowsData } from "@/components/ui/grid-list";

type PersonData = {
	id: string;
	name: string;
};

export default function SelectedPeopleNameList() {
	const selectedRows = useSelectedRowsData<PersonData>();

	return (
		<ol className="list-decimal list-inside">
			{selectedRows.map((person) => {
				const data = person.data;
				return (
					<li key={data.id} className="tracking-tight">
						{data.name}
					</li>
				);
			})}
		</ol>
	);
}
