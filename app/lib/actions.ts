'use server';

import { z } from 'zod';
import { invoices } from '@/app/lib/placeholder-data';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  await (async() => {
    invoices.push({
      customer_id: customerId,
      amount: amountInCents,
      status,
      date,
    })
  })();

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  const amountInCents = amount * 100;
  await (async() => {
    const index = Number(id);
    const current = invoices[index];
    invoices.splice(index, 1, {
      ...current,
      customer_id: customerId,
      amount: amountInCents,
      status,
    });
  })();
  console.log(invoices);
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  await (async() => {
    const index = Number(id);
    invoices.splice(index, 1);
  })();

  revalidatePath('/dashboard/invoices');
}
