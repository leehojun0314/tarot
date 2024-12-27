BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Card] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [content] TEXT NOT NULL CONSTRAINT [Card_content_df] DEFAULT '',
    CONSTRAINT [Card_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [User_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ChatRoom] (
    [id] INT NOT NULL IDENTITY(1,1),
    [userId] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ChatRoom_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [ChatRoom_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ChatRoom_userId_key] UNIQUE NONCLUSTERED ([userId])
);

-- CreateTable
CREATE TABLE [dbo].[ChatRoom_Card] (
    [id] INT NOT NULL IDENTITY(1,1),
    [chatRoomId] INT NOT NULL,
    [cardId] INT NOT NULL,
    [isOpposite] BIT NOT NULL,
    CONSTRAINT [ChatRoom_Card_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Message] (
    [id] INT NOT NULL IDENTITY(1,1),
    [chatRoomId] INT NOT NULL,
    [sender] NVARCHAR(1000) NOT NULL,
    [message] NVARCHAR(1000) NOT NULL,
    [timestamp] DATETIME2 NOT NULL CONSTRAINT [Message_timestamp_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Message_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[ChatRoom] ADD CONSTRAINT [ChatRoom_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ChatRoom_Card] ADD CONSTRAINT [ChatRoom_Card_chatRoomId_fkey] FOREIGN KEY ([chatRoomId]) REFERENCES [dbo].[ChatRoom]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ChatRoom_Card] ADD CONSTRAINT [ChatRoom_Card_cardId_fkey] FOREIGN KEY ([cardId]) REFERENCES [dbo].[Card]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Message] ADD CONSTRAINT [Message_chatRoomId_fkey] FOREIGN KEY ([chatRoomId]) REFERENCES [dbo].[ChatRoom]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
