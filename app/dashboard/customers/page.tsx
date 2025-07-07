import { Metadata } from "next";


//页面中的元数据将覆盖父页面中的元数据。
export const metadata: Metadata = {
  title: 'Customers',
};


export default function Page() {
    return <p>Customers Page</p>;
}