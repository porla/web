import { useAppForm } from '@/hooks/form';
import { useInvoker } from '@/jsonrpc';
import { readFile } from '@/utils';
import { createFileRoute } from '@tanstack/react-router'
import { Suspense } from 'react';

export const Route = createFileRoute('/_layout/add')({
  component: RouteComponent,
})

type AddTorrentForm = {
  save_path: string;
  ti: FileList | null;
}

function RouteComponent() {
  const add = useInvoker("torrents.add");

  const form = useAppForm({
    defaultValues: {
      save_path: "",
      ti: null
    } as AddTorrentForm,
    onSubmit: async ({ value }) => {
      if (value.ti === null) {
        return;
      }

      await add.mutateAsync({
        save_path: value.save_path,
        ti: await readFile(value.ti[0])
      })
    }
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className='p-3'
    >
      <div className="divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow-sm dark:divide-white/10 dark:bg-gray-800/50 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10">
        <div className="px-3 py-3 flex items-center justify-between">
          <h1 className="font-medium">Add torrent</h1>

          <div className="inline-flex rounded-md shadow-xs dark:shadow-none">
            <button
              type="submit"
              className="relative inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 inset-ring-1 inset-ring-gray-300 hover:bg-gray-50 focus:z-10 dark:bg-white/10 dark:text-white dark:inset-ring-gray-700 dark:hover:bg-white/20"
              disabled={form.state.isSubmitting}
            >
              Add
            </button>
          </div>
        </div>
        <div className="px-4 py-5 space-y-5">
          <Suspense fallback={<p>Loading fields</p>}>
            <form.AppField
              name="ti"
              children={(field) => <field.FileListField label="Torrent file(s)" />}
            />

            <form.AppField
              name="save_path"
              children={(field) => <field.TextField label="Save path" />}
            />
          </Suspense>
        </div>
      </div>
    </form>
  )
}
