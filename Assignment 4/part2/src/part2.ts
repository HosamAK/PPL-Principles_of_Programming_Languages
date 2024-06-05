// PPL 2023 HW4 Part2

// Q 2.1 

// Specify the return type.
export const delayedSum = (a: number, b: number, delay: number): Promise<number> => {
   return new Promise((resolve) => {
        setTimeout(() => {
            const s: number = a + b
            resolve(s)
        }, delay)
   })
}


export const testDelayedSum = (num1: number, num2: number, delay: number): Promise<string> => {
    return new Promise<string>((res, rej) => {
        const before: number = Date.now()
        delayedSum(num1, num2, delay).then(() => {
            const after = Date.now()
            const interval = after - before
            if(interval >= delay){
                res("Test passed")
            }
            else{
                rej("Test failed")
            }
        }).catch((err) => new Error(err))
    })
}
 

// Q 2.2

// Values returned by API calls.
export type Post = {
    userId: number;
    id: number;
    title: string;
    body: string;
}

// When invoking fetchData(postsUrl) you obtain an Array Post[]
// To obtain an array of posts
export const postsUrl = 'https://jsonplaceholder.typicode.com/posts'; 

// Append the desired post id.
export const postUrl = 'https://jsonplaceholder.typicode.com/posts/'; 

// When invoking fetchData(invalidUrl) you obtain an error
export const invalidUrl = 'https://jsonplaceholder.typicode.com/invalid';

// Depending on the url - fetchData can return either an array of Post[] or a single Post.
// Specify the return type without using any.
export const fetchData = async (url: String): Promise<any> => {
        const result = await fetch(url.toString())
        const after_json = result.json()
        if(!result.ok){
            throw new Error("error fetching")
        }
        return after_json
}

export const testFetchData = async (url: string): Promise<string> => {
    try{
        expect(!Array.isArray(await fetchData(postsUrl))).toEqual(false)
        const posts = await fetch(postsUrl)
        const check_length = await posts.json()
        expect(check_length.length).toEqual(100)
        const fetch_url = await fetchData(url)
        expect(fetch_url).toHaveProperty('title')
        expect(fetch_url).toHaveProperty('body')
        expect(fetch_url).toHaveProperty('userId')        
        expect(fetch_url).toHaveProperty('id')
        return "Test passed"
    } catch (err){
        throw new Error()
    }
}

// Q 2.3

// Specify the return type.
// export const fetchMultipleUrls = async (urls: string[]): Promise<any[]> => {
//     const fetch_urls = urls.map((url) => fetch(url))
//     const arr_promise = await Promise.all(fetch_urls)
//     const ret =  await Promise.all(arr_promise.map((prom) => prom.json()))
//     return ret
// }

export const fetchMultipleUrls = async (ur: string[]): Promise<any[]> => {
    const arr = ur.map((url) => fetch(url))
    const check = await Promise.all(arr.map(async (check) => { if(!(await check).ok) throw new Error()}))

    const res = await Promise.all(arr)
    const josss =  await Promise.all(res.map((response) => response.json()))
    return josss
}

export const testFetchMultipleUrls = async(): Promise<string>=> {
    try {
        const url = 'https://jsonplaceholder.typicode.com/posts/1';
        const arr_urls = Array.from({ length: 20 }, (_, index) => postUrl + (index + 1));
        check_ret(arr_urls, url)
        return "Test passed"
    } catch (err) {
    return "Test failed"}
}

const check_ret = async (arr_urls: string[], url: string): Promise<void> =>{
    const fetch_urls = await fetchMultipleUrls(arr_urls)
    expect(fetch_urls.length).toEqual(20)
    const last_id=fetch_urls[fetch_urls.length - 1].id
    expect(last_id).toEqual(url);
}