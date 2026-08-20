import { PageHeader } from "@/components/PageHeader";
import { CsvImport } from "@/components/CsvImport";
import { DomainSearch } from "@/components/DomainSearch";
import { LocalBusinessFinder } from "@/components/LocalBusinessFinder";

export default function ClientFinderPage() {
  return (
    <div>
      <PageHeader eyebrow="LEAD SOURCING" title="Client Finder" />
      <div className="mb-5">
        <LocalBusinessFinder />
      </div>
      <div className="grid grid-cols-2 gap-5">
        <CsvImport />
        <DomainSearch />
      </div>
    </div>
  );
}
