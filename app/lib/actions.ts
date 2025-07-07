"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import postgres from "postgres";
import { z } from "zod";
const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

const FormSchema = z.object({
  id: z.string(),
  //但如果用户没有选择客户，我们可以添加一条友好信息。
  customerId: z.string({
    invalid_type_error: "Please select a customer.",
  }),
  // 强制将字符串转换为数字
  amount: z.coerce
    .number()
    .gt(0, { message: "Please enter an amount greater than $0." }),
  //如果用户没有选择状态，我们还可以添加一条友好信息。
  status: z.enum(["pending", "paid"], {
    invalid_type_error: "Please select an invoice status.",
  }),
  date: z.string(),
});

//省略了id和date属性后得到的新模式。
const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

//使用useActionState钩子来处理表单提交，第一个参数是上一个state，第二个参数才是表单数据
//返回新的state
export async function createInvoice(prevState: State, formData: FormData) {
  //与Form的 name对应
  const rawFormData = {
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  };
  // Test it out:
  // console.log(rawFormData);

  //验证类型
  // const { customerId, amount, status } = CreateInvoice.parse(rawFormData);
  const validatedFields = CreateInvoice.safeParse(rawFormData);
  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    console.log(validatedFields.error.flatten());
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Invoice.",
    };
  }

  // Prepare data for insertion into the database
  const { customerId, amount, status } = validatedFields.data;

  //更改单位
  const amountInCents = amount * 100;

  //该方法将日期和时间按照 ISO 8601 标准格式转换为字符串，例如"2025-06-20T23:38:17.000Z"。
  //然后按T分拆
  const date = new Date().toISOString().split("T")[0];

  try {
    //插入数据
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
  } catch (error) {
    // We'll log the error to the console for now
    console.error(error);
    return {
      message: "Database Error: Failed to Create Invoice.",
    };
  }

  //当前路径需要清除缓存并向服务器发出新请求并重新渲染表
  revalidatePath("/dashboard/invoices");
  //重定向到发票列表页面 redirect 是通过抛出错误来工作的,所以放到trycatch之外
  redirect("/dashboard/invoices");
}

export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData
) {
  //与Form的 name对应
  const rawFormData = {
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  };
  // Test it out:
  console.log(id, rawFormData);

  //验证类型
  // const { customerId, amount, status } = UpdateInvoice.parse(rawFormData);
  const validatedFields = UpdateInvoice.safeParse(rawFormData);

  if (!validatedFields.success) {
    console.log(validatedFields.error.flatten());
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Update Invoice.",
    };
  }

  const { customerId, amount, status } = validatedFields.data;

  //更改单位
  const amountInCents = amount * 100;

  try {
    //更新数据
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;
  } catch (error) {
    // We'll log the error to the console for now
    console.error(error);
    return { message: "Database Error: Failed to Update Invoice." };
  }

  //当前路径需要清除缓存并向服务器发出新请求并重新渲染表
  revalidatePath("/dashboard/invoices");
  //重定向到发票列表页面  redirect 是通过抛出错误来工作的,所以放到trycatch之外
  redirect("/dashboard/invoices");
}

export async function deleteInvoice(id: string) {
  // throw new Error('Failed to Delete Invoice');
  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
  } catch (error) {
    // We'll log the error to the console for now
    console.error(error);
  }

  //当前路径需要清除缓存并向服务器发出新请求并重新渲染表
  revalidatePath("/dashboard/invoices");
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData
) {
  try {
    //指定使用 Credentials Provider 进行登录，'credentials' 是固定值，
    //表示使用「基于表单的自定义登录」。 触发auth.ts的authorize函数。
    await signIn("credentials", formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid credentials.";
        default:
          return "Something went wrong.";
      }
    }
    throw error;
  }
}
