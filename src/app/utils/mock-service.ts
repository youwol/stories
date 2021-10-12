import { MockService } from "../../tests/mock-client"
import { storiesUnitTests } from "../../tests/mock-data/database"
import { Client } from "../client/client"

/**
 * Setup mock service of stories-backend
 */
export function setupMockService(){

    Client.service = new MockService({
        data: localStorage.getItem("stories-storage")
            ? JSON.parse(localStorage.getItem("stories-storage"))
            : storiesUnitTests,
        persist: (data) => {
            localStorage.setItem("stories-storage", JSON.stringify(data)) 
        }
    })
}