import { MockService } from "../../tests/mock-client"
import { Client } from "../client/client"

/**
 * Setup mock service of stories-backend
 */
export function setupMockService(data){

    Client.service = new MockService({
        data,
        persist: (updatedData) => {
            localStorage.setItem("stories-storage", JSON.stringify(updatedData)) 
        }
    })
}