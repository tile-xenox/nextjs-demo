import {
  CustomerField,
  CustomersTableType,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  Revenue,
} from './definitions';
import { formatCurrency } from './utils';
import { revenue, customers, invoices, users } from './placeholder-data';

export async function fetchRevenue() {
  try {
    // Artificially delay a response for demo purposes.
    // Don't do this in production :)

    console.log('Fetching revenue data...');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // const data = await sql<Revenue>`SELECT * FROM revenue`;
    const data: { rows: Revenue[] } = {
      rows: [...revenue],
    };

    console.log('Data fetch completed after 3 seconds.');

    return data.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}

export async function fetchLatestInvoices() {
  try {
    // const data = await sql<LatestInvoiceRaw>`
    //   SELECT invoices.amount, customers.name, customers.image_url, customers.email, invoices.id
    //   FROM invoices
    //   JOIN customers ON invoices.customer_id = customers.id
    //   ORDER BY invoices.date DESC
    //   LIMIT 5`;
    
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const data: { rows: LatestInvoiceRaw[] } = {
      rows: [...invoices]
        .map((v, i) => ({ ...v, id: i + '' }))
        .sort((a, b) => new Date(b.date).getTime() -  new Date(a.date).getTime())
        .map(({ customer_id, amount, id }) => {
          const {
            name = '',
            image_url = '',
            email = '',
          } = customers.find(({ id }) => id === customer_id) ?? {};
          return {
            amount,
            name,
            image_url,
            email,
            id,
          };
        })
        .slice(0, 5),
    }

    const latestInvoices = data.rows.map((invoice) => ({
      ...invoice,
      amount: formatCurrency(invoice.amount),
    }));
    return latestInvoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices.');
  }
}

export async function fetchCardData() {
  try {
    // You can probably combine these into a single SQL query
    // However, we are intentionally splitting them to demonstrate
    // how to initialize multiple queries in parallel with JS.
    // const invoiceCountPromise = sql`SELECT COUNT(*) FROM invoices`;
    // const customerCountPromise = sql`SELECT COUNT(*) FROM customers`;
    // const invoiceStatusPromise = sql`SELECT
    //      SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS "paid",
    //      SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS "pending"
    //      FROM invoices`;

    // const data = await Promise.all([
    //   invoiceCountPromise,
    //   customerCountPromise,
    //   invoiceStatusPromise,
    // ]);

    await new Promise((resolve) => setTimeout(resolve, 1000));
    const data = await Promise.all([
      { rows: [{ count: invoices.length }] },
      { rows: [{ count: customers.length }] },
      {
        rows: [{
          paid: invoices
            .map(({ status, amount }) => status === 'paid' ? amount : 0)
            .reduce((p, c) => p + c, 0),
          pending: invoices
            .map(({ status, amount }) => status === 'pending' ? amount : 0)
            .reduce((p, c) => p + c, 0),
        }]
      },
    ]);

    const numberOfInvoices = Number(data[0].rows[0].count ?? '0');
    const numberOfCustomers = Number(data[1].rows[0].count ?? '0');
    const totalPaidInvoices = formatCurrency(data[2].rows[0].paid ?? '0');
    const totalPendingInvoices = formatCurrency(data[2].rows[0].pending ?? '0');

    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}

const ITEMS_PER_PAGE = 6;
export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    // const invoices = await sql<InvoicesTable>`
    //   SELECT
    //     invoices.id,
    //     invoices.amount,
    //     invoices.date,
    //     invoices.status,
    //     customers.name,
    //     customers.email,
    //     customers.image_url
    //   FROM invoices
    //   JOIN customers ON invoices.customer_id = customers.id
    //   WHERE
    //     customers.name ILIKE ${`%${query}%`} OR
    //     customers.email ILIKE ${`%${query}%`} OR
    //     invoices.amount::text ILIKE ${`%${query}%`} OR
    //     invoices.date::text ILIKE ${`%${query}%`} OR
    //     invoices.status ILIKE ${`%${query}%`}
    //   ORDER BY invoices.date DESC
    //   LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    // `;

    const data: { rows: InvoicesTable[] } = {
      rows: invoices
        .map((v, i) => ({ ...v, id: i + '' }))
        .sort((a, b) => new Date(b.date).getTime() -  new Date(a.date).getTime())
        .map((v) => ({
          ...v,
          customer: customers.find(({ id }) => id === v.customer_id),
        }))
        .filter(({
          customer: { name, email } = {},
          amount,
          date,
          status,
        }) => {
          if (name?.includes(query)) return true;
          if (email?.includes(query)) return true;
          if (`${amount}`.includes(query)) return true;
          if (date.includes(query)) return true;
          if (status.includes(query)) return true;
          return false;
        })
        .slice(offset, offset + ITEMS_PER_PAGE)
        .map(({
          id,
          amount,
          date,
          status,
          customer_id,
          customer: {
            name = '',
            email = '',
            image_url = '',
          } = {}
        }) => ({
          id,
          amount,
          date,
          status: status === 'paid' ? 'paid' : 'pending',
          customer_id,
          name,
          email,
          image_url,
        }))
    }

    return data.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  }
}

export async function fetchInvoicesPages(query: string) {
  try {
  //   const count = await sql`SELECT COUNT(*)
  //   FROM invoices
  //   JOIN customers ON invoices.customer_id = customers.id
  //   WHERE
  //     customers.name ILIKE ${`%${query}%`} OR
  //     customers.email ILIKE ${`%${query}%`} OR
  //     invoices.amount::text ILIKE ${`%${query}%`} OR
  //     invoices.date::text ILIKE ${`%${query}%`} OR
  //     invoices.status ILIKE ${`%${query}%`}
  // `;

  const count = {
    rows: [{
      count: invoices
        .map((v) => ({
          ...v,
          customer: customers.find(({ id }) => id === v.customer_id),
        }))
        .filter(({
          customer: { name, email } = {},
          amount,
          date,
          status,
        }) => {
          if (name?.includes(query)) return true;
          if (email?.includes(query)) return true;
          if (`${amount}`.includes(query)) return true;
          if (date.includes(query)) return true;
          if (status.includes(query)) return true;
          return false;
        })
      .length,
    }]
  }

    const totalPages = Math.ceil(Number(count.rows[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

export async function fetchInvoiceById(id: string) {
  try {
    // const data = await sql<InvoiceForm>`
    //   SELECT
    //     invoices.id,
    //     invoices.customer_id,
    //     invoices.amount,
    //     invoices.status
    //   FROM invoices
    //   WHERE invoices.id = ${id};
    // `;

    const data: { rows: InvoiceForm[] } = {
      rows: invoices
        .map((v, i) => ({ ...v, id: i + '' }))
        .filter((v) => v.id === id)
        .map(({
          id,
          customer_id,
          amount,
          status,
        }) => ({
          id,
          customer_id,
          amount,
          status: status === 'paid' ? 'paid' : 'pending',
        }))
    }

    const invoice = data.rows.map((invoice) => ({
      ...invoice,
      // Convert amount from cents to dollars
      amount: invoice.amount / 100,
    }));

    return invoice[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  }
}

export async function fetchCustomers() {
  try {
    // const data = await sql<CustomerField>`
    //   SELECT
    //     id,
    //     name
    //   FROM customers
    //   ORDER BY name ASC
    // `;

    const data: { rows: CustomerField[] } = {
      rows: [...customers]
        .sort((a, b) => {
          if (a.name > b.name) return 1;
          if (a.name < b.name) return -1;
          return 0;
        })
        .map(({ id, name }) => ({ id, name }))
    };

    return data.rows;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all customers.');
  }
}

export async function fetchFilteredCustomers(query: string) {
  try {
    // const data = await sql<CustomersTableType>`
		// SELECT
		//   customers.id,
		//   customers.name,
		//   customers.email,
		//   customers.image_url,
		//   COUNT(invoices.id) AS total_invoices,
		//   SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) AS total_pending,
		//   SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END) AS total_paid
		// FROM customers
		// LEFT JOIN invoices ON customers.id = invoices.customer_id
		// WHERE
		//   customers.name ILIKE ${`%${query}%`} OR
    //     customers.email ILIKE ${`%${query}%`}
		// GROUP BY customers.id, customers.name, customers.email, customers.image_url
		// ORDER BY customers.name ASC
	  // `;

    const data: { rows: CustomersTableType[] } = {
      rows: customers
        .map((v) => ({
          ...v,
          invoices: invoices.filter(({ customer_id }) => customer_id === v.id),
        }))
        .filter(({ name, email }) => name.includes(query) || email.includes(query))
        .sort((a, b) => {
          if (a.name > b.name) return 1;
          if (a.name < b.name) return -1;
          return 0;
        })
        .map(({
          id,
          name,
          email,
          image_url,
          invoices,
        }) => ({
          id,
          name,
          email,
          image_url,
          total_invoices: invoices.length,
          total_pending: invoices
            .map(({ status, amount }) => status === 'pending' ? amount : 0)
            .reduce((p, c) => p + c, 0),
          total_paid: invoices
            .map(({ status, amount }) => status === 'paid' ? amount : 0)
            .reduce((p, c) => p + c, 0),
        }))
    }


    const customersData = data.rows.map((customer) => ({
      ...customer,
      total_pending: formatCurrency(customer.total_pending),
      total_paid: formatCurrency(customer.total_paid),
    }));

    return customersData;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch customer table.');
  }
}
