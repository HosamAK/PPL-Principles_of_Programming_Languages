import { describe, expect, test } from '@jest/globals'
import {
    delayedSum, Post, postsUrl, postUrl, invalidUrl, fetchData, fetchMultipleUrls, testDelayedSum, testFetchData
} from '../src/part2';

describe('Assignment 4 Part 2', () => {
    describe('Q2.1 delayedSum (6 points)', () => {
        test('delayedSum returns the sum', async () => {
          await delayedSum(5, 5, 1500).then((r) => expect(r).toEqual(10))
          await delayedSum(6, 5, 1500).then((r) => expect(r).toEqual(11))
          await delayedSum(7, 5, 1000).then((r) => expect(r).toEqual(12))
        })
        
        test('delayedSum waits at least the specified delay', async () => {
            await testDelayedSum(1, 2, 3000).then((r) => expect(r).toEqual("Test passed"))
            await testDelayedSum(2, 1, 3000).then((r) => expect(r).toEqual("Test passed"))
            await testDelayedSum(3, 3, 3000).then((r) => expect(r).toEqual("Test passed"))
        })
    })

    describe('Q2.2 fetchData (12 points)', () => {
        test('successful call to fetchData with array result', async () => {
            await expect(testFetchData('https://jsonplaceholder.typicode.com/posts/1')).resolves.toEqual("Test passed")
        })

        test('successful call to fetchData with Post result', async () => {
            const expected = { userId: 1, id: 1, 
            body: 'quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto',
            title: 'sunt aut facere repellat provident occaecati excepturi optio reprehenderit'};
            const result = await fetchData('https://jsonplaceholder.typicode.com/posts/1');
            expect(result).toEqual(expected);
        })

        test('failed call to fechData', async () => {
            await expect(fetchData('https://jsonplaceholder.typicode.com/invalid')).rejects.toThrow();
        })

    })

    describe('Q2.3 fetchMultipleUrls (12 points)', () => {
        test('successful call to fetchMultipleUrls', async () => {
            const arr=[postUrl+1, postUrl+15]
            expect(!Array.isArray( await fetchMultipleUrls(arr))).toEqual(false);           
            try {
            expect(!Array.isArray(await fetchMultipleUrls(arr))).toEqual(false);
            } catch (err) {
                throw new Error()
            }
        })

        test('successful call to fetchMultipleUrls: verify results are in the expected order ', async () => {
            const arr=[postUrl+22, postUrl+3]
            const check = await fetchMultipleUrls(arr)
            expect(check[0].id).toEqual(22)
            expect(check[1].id).toEqual(3)
        })

        test('failed call to fetchMultipleUrls', async () => {
            const check=fetchMultipleUrls([invalidUrl])
            await expect(check).rejects.toThrow()
        })

    })
});

