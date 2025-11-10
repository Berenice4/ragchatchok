/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

const TypingIndicator: React.FC = () => {
    return (
        <div className="flex items-center space-x-1.5 p-2">
            <div className="h-2.5 w-2.5 bg-hitech-text-primary/50 rounded-full typing-dot"></div>
            <div className="h-2.5 w-2.5 bg-hitech-text-primary/50 rounded-full typing-dot"></div>
            <div className="h-2.5 w-2.5 bg-hitech-text-primary/50 rounded-full typing-dot"></div>
        </div>
    );
};

export default TypingIndicator;