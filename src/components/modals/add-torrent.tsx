'use client'

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import Button from '@/components/button';
import { useAppForm } from '@/hooks/form';
import { useInvoker } from '@/jsonrpc';
import { Suspense } from 'react';

const readSingleFile = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function () {
      const idx = reader.result?.toString().indexOf("base64,")!;
      const data = reader.result?.toString().substring(idx + "base64,".length);
      if (!data) return reject();
      resolve(data);
    };
    reader.onerror = () => reject();
    reader.readAsDataURL(blob);
  });
}

type AddTorrentModalProps = {
  open: boolean;
  onClose: () => void;
}

type AddTorrentForm = {
  save_path: string;
  ti: FileList | null;
}

export default function AddTorrentModal(props: AddTorrentModalProps) {
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

      await add({
        save_path: value.save_path,
        ti: await readSingleFile(value.ti[0])
      })

      props.onClose();
    }
  });

  return (
    <Dialog open={props.open} onClose={() => props.onClose()} className="relative z-10">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in dark:bg-gray-900/75"
      />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel
            transition
            className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg data-closed:sm:translate-y-0 data-closed:sm:scale-95 dark:bg-gray-800 dark:outline dark:-outline-offset-1 dark:outline-white/10"
          >
            <Suspense fallback={<p className='h-36'>Loading form</p>}>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  form.handleSubmit()
                }}
              >
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 dark:bg-gray-800">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:size-10 dark:bg-red-500/10">
                      <ExclamationTriangleIcon aria-hidden="true" className="size-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="mt-3 flex-1 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <DialogTitle as="h3" className="text-base font-semibold text-gray-900 dark:text-white">
                        Add torrent
                      </DialogTitle>
                      <div className="mt-2 space-y-3">
                        <form.AppField
                          name="ti"
                          children={(field) => <field.FileListField label="Torrent file(s)" />}
                        />

                        <form.AppField
                          name="save_path"
                          children={(field) => <field.TextField label="Save path" />}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 dark:bg-gray-700/25">
                  <Button
                    text="Add torrent"
                    type="submit"
                  />
                </div>
              </form>
            </Suspense>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  )
}
